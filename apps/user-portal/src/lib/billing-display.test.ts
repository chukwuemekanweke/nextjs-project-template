import { ApiError } from "@template/api-client";
import { subscriptionPurchaseStatuses } from "@template/api-client/subscriptions";
import { describe, expect, it } from "vitest";
import {
  bankTransferDetails,
  canScheduleCancellation,
  describeBillingLoadError,
  describeCancellationError,
  describeCancellationResult,
  describePaymentStatus,
  describePurchaseError,
  describePurchaseStatus,
  describeSubscription,
  formatBillingDate,
  isBackendId,
  safePaymentLink,
} from "./billing-display";

const apiError = (status: number) =>
  new ApiError({ kind: "unexpected", safeMessage: "Request failed", status });

describe("billing dates", () => {
  it("formats backend timestamps without deriving dates", () => {
    expect(formatBillingDate("2026-12-23T12:05:00Z", { timeZone: "UTC" })).toBe(
      "Dec 23, 2026",
    );
    expect(formatBillingDate(null)).toBeUndefined();
    expect(formatBillingDate("not-a-date")).toBeUndefined();
  });
});

describe("purchase status presentation", () => {
  it("covers every documented status", () => {
    for (const status of subscriptionPurchaseStatuses) {
      expect(describePurchaseStatus(status).kind).not.toBe("unknown");
    }
  });

  it("distinguishes received payment from completed activation", () => {
    const presentation = describePurchaseStatus(
      "PaymentSucceededFulfillmentPending",
    );
    expect(presentation.kind).toBe("payment-received");
    expect(presentation.description).toContain("payment was received");
    expect(presentation.description).toContain("activating");
  });

  it("presents blocked fulfillment without claiming payment failed", () => {
    const presentation = describePurchaseStatus("FulfillmentBlocked");
    expect(presentation.kind).toBe("blocked");
    expect(presentation.description).toContain(
      "does not mean your payment failed",
    );
  });

  it("groups unsuccessful payment outcomes for a new checkout", () => {
    for (const status of [
      "PaymentFailed",
      "PaymentCancelled",
      "PaymentExpired",
      "PaymentUnderpaid",
    ]) {
      expect(describePurchaseStatus(status).kind).toBe("payment-unsuccessful");
    }
  });

  it("handles fallback statuses safely", () => {
    expect(describePurchaseStatus("SubscriptionPending").kind).toBe("unknown");
  });
});

describe("subscription presentation", () => {
  it("uses lifecycle status and preserves the cancellation distinction", () => {
    expect(
      describeSubscription({
        cancelAtPeriodEnd: false,
        lifecycleStatus: "PastDue",
      }).label,
    ).toBe("Past due");
    expect(
      describeSubscription({
        cancelAtPeriodEnd: true,
        lifecycleStatus: "Active",
      }).label,
    ).toBe("Cancellation scheduled");
    expect(
      describeSubscription({
        cancelAtPeriodEnd: false,
        lifecycleStatus: "Pending",
      }).label,
    ).toBe("Pending");
  });

  it("offers cancellation only for active, not-yet-cancelling subscriptions", () => {
    expect(
      canScheduleCancellation({ cancelAtPeriodEnd: false, status: "Active" }),
    ).toBe(true);
    expect(
      canScheduleCancellation({ cancelAtPeriodEnd: true, status: "Active" }),
    ).toBe(false);
    expect(
      canScheduleCancellation({ cancelAtPeriodEnd: false, status: "Pending" }),
    ).toBe(false);
  });

  it("describes cancellation with the backend entitlement date", () => {
    expect(
      describeCancellationResult({
        changed: true,
        entitledUntilUtc: "2026-12-23T12:05:00Z",
      }),
    ).toBe("Cancellation scheduled. You keep access until Dec 23, 2026.");
    expect(
      describeCancellationResult({ changed: false, entitledUntilUtc: null }),
    ).toBe("Cancellation was already scheduled.");
  });
});

describe("payment instructions", () => {
  it("accepts only absolute HTTPS payment links without credentials", () => {
    expect(safePaymentLink({ paymentLink: "https://pay.example/c/1" })).toBe(
      "https://pay.example/c/1",
    );
    expect(
      safePaymentLink({ paymentLink: "http://pay.example" }),
    ).toBeUndefined();
    expect(
      safePaymentLink({ paymentLink: "https://user:pass@pay.example" }),
    ).toBeUndefined();
    expect(safePaymentLink({ paymentLink: "/relative" })).toBeUndefined();
    expect(safePaymentLink({})).toBeUndefined();
  });

  it("renders only documented bank-transfer fields", () => {
    expect(
      bankTransferDetails({
        accountName: "Template Ltd",
        accountNumber: "0123456789",
        bankName: "Example Bank",
        internalSecret: "never shown",
        providerReference: "ref-1",
      }),
    ).toEqual([
      { label: "Bank", value: "Example Bank" },
      { label: "Account name", value: "Template Ltd" },
      { label: "Account number", value: "0123456789" },
      { label: "Payment reference", value: "ref-1" },
    ]);
  });
});

describe("billing history statuses", () => {
  it("does not label unsuccessful attempts as paid", () => {
    expect(describePaymentStatus("Succeeded").label).toBe("Paid");
    expect(describePaymentStatus("Failed").label).toBe("Failed");
    expect(describePaymentStatus("Initiated").label).toBe("Pending");
    expect(describePaymentStatus("SomethingNew").label).toBe("SomethingNew");
  });
});

describe("error presentation", () => {
  it("discards the attempt only after definitive rejections", () => {
    expect(describePurchaseError(apiError(409)).discardAttempt).toBe(true);
    expect(describePurchaseError(apiError(400)).discardAttempt).toBe(true);
    expect(describePurchaseError(apiError(404)).discardAttempt).toBe(true);
    expect(describePurchaseError(apiError(401)).discardAttempt).toBe(false);
    expect(describePurchaseError(apiError(503)).discardAttempt).toBe(false);
    expect(describePurchaseError(new TypeError("fetch failed"))).toEqual({
      discardAttempt: false,
      message: expect.stringContaining("will not create a second purchase"),
    });
  });

  it("never leaks backend detail", () => {
    const error = new ApiError({
      detail: "SubscriptionEntitlementConflictException at line 42",
      kind: "conflict",
      safeMessage: "Conflict",
      status: 409,
    });
    expect(describePurchaseError(error).message).not.toContain("Exception");
    expect(describeCancellationError(apiError(404))).toBe(
      "There is no active subscription to cancel.",
    );
    expect(describeBillingLoadError(apiError(500), "billing history")).toBe(
      "Billing history could not be loaded. Refresh and try again.",
    );
  });
});

describe("identifier validation", () => {
  it("accepts backend UUIDs only", () => {
    expect(isBackendId("019a0000-0000-7000-8000-000000000001")).toBe(true);
    expect(isBackendId("../../etc")).toBe(false);
    expect(isBackendId(undefined)).toBe(false);
  });
});
