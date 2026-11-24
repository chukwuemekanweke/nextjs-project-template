import { describe, expect, it } from "vitest";
import {
  canonicalPaymentReturnRoute,
  isAwaitingBackend,
  resolvePaymentReturnView,
  type ProviderReturnHint,
} from "./payment-return";

const HINTS: ProviderReturnHint[] = ["success", "cancelled", undefined];
const view = (status: string, hint: ProviderReturnHint) =>
  resolvePaymentReturnView({ status }, hint);

describe("resolvePaymentReturnView", () => {
  it("shows success only for a backend-confirmed active subscription", () => {
    for (const hint of HINTS) {
      expect(view("SubscriptionActive", hint)).toBe("active");
      expect(view("SubscriptionScheduled", hint)).toBe("scheduled");
    }
  });

  it("never treats a paid but unfulfilled purchase as activated", () => {
    for (const hint of HINTS) {
      expect(view("PaymentSucceededFulfillmentPending", hint)).toBe(
        "activating",
      );
    }
  });

  it("does not let a success redirect override a failed or pending payment", () => {
    expect(view("PaymentFailed", "success")).toBe("failed");
    expect(view("PaymentExpired", "success")).toBe("expired");
    expect(view("PaymentUnderpaid", "success")).toBe("underpaid");
    expect(view("PaymentPending", "success")).toBe("pending");
    expect(view("PurchaseInitiated", "success")).toBe("pending");
  });

  it("does not let a cancel redirect override a paid purchase", () => {
    expect(view("SubscriptionActive", "cancelled")).toBe("active");
    expect(view("PaymentSucceededFulfillmentPending", "cancelled")).toBe(
      "activating",
    );
    expect(view("FulfillmentBlocked", "cancelled")).toBe("blocked");
  });

  it("does not declare cancellation while the backend has no final payment state", () => {
    expect(view("PaymentPending", "cancelled")).toBe("not-completed");
    expect(view("PurchaseInitiated", "cancelled")).toBe("not-completed");
  });

  it("reads a cancel return with a failed payment as a cancellation", () => {
    // Bachs records a cancelled checkout as a failed payment.
    expect(view("PaymentFailed", "cancelled")).toBe("cancelled");
    expect(view("PaymentCancelled", "cancelled")).toBe("cancelled");
    expect(view("PaymentCancelled", undefined)).toBe("cancelled");
    expect(view("PaymentFailed", undefined)).toBe("failed");
  });

  it("handles ended subscriptions and unknown future statuses safely", () => {
    expect(view("SubscriptionCancelled", "success")).toBe("subscription-ended");
    expect(view("SubscriptionExpired", undefined)).toBe("subscription-ended");
    expect(view("SomethingNew", "success")).toBe("unknown");
  });
});

describe("canonicalPaymentReturnRoute", () => {
  it("moves confirmed outcomes to their matching route", () => {
    expect(canonicalPaymentReturnRoute("active", "cancelled")).toBe(
      "/billing/checkout/success",
    );
    expect(canonicalPaymentReturnRoute("active", undefined)).toBe(
      "/billing/checkout/success",
    );
    expect(canonicalPaymentReturnRoute("cancelled", "success")).toBe(
      "/billing/checkout/cancelled",
    );
    expect(canonicalPaymentReturnRoute("cancelled", undefined)).toBe(
      "/billing/checkout/cancelled",
    );
  });

  it("stays put when already on the matching route or not yet final", () => {
    expect(canonicalPaymentReturnRoute("active", "success")).toBeUndefined();
    expect(
      canonicalPaymentReturnRoute("cancelled", "cancelled"),
    ).toBeUndefined();
    for (const pending of ["pending", "activating", "not-completed"] as const) {
      for (const hint of HINTS) {
        expect(canonicalPaymentReturnRoute(pending, hint)).toBeUndefined();
      }
    }
  });
});

describe("isAwaitingBackend", () => {
  it("only waits for non-final views", () => {
    expect(isAwaitingBackend("pending")).toBe(true);
    expect(isAwaitingBackend("activating")).toBe(true);
    expect(isAwaitingBackend("not-completed")).toBe(true);
    expect(isAwaitingBackend("active")).toBe(false);
    expect(isAwaitingBackend("cancelled")).toBe(false);
    expect(isAwaitingBackend("failed")).toBe(false);
  });
});
