import { ApiError } from "@template/api-client";
import type { GetSubscriptionPurchaseStatusQueryResponse } from "@template/api-client/subscriptions";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useRememberedCheckoutAttempt: vi.fn(),
  useSubscriptionPurchaseStatus: vi.fn(),
}));

vi.mock("@template/api-react/subscriptions", () => ({
  useSubscriptionPurchaseStatus: (...args: unknown[]) =>
    hooks.useSubscriptionPurchaseStatus(...args),
}));
vi.mock("@/lib/use-checkout-attempt", () => ({
  useRememberedCheckoutAttempt: () => hooks.useRememberedCheckoutAttempt(),
}));

import { PurchaseStatusView } from "./purchase-status-view";

const PURCHASE_ID = "019a0000-0000-7000-8000-000000000002";
const PLAN_ID = "019a0000-0000-7000-8000-000000000001";

function status(
  overrides: Partial<GetSubscriptionPurchaseStatusQueryResponse> = {},
): GetSubscriptionPurchaseStatusQueryResponse {
  return {
    amount: 750000,
    currencyCode: "NGN",
    currentPeriodEndUtc: null,
    fulfilledAtUtc: null,
    fulfillmentBlockedAtUtc: null,
    fulfillmentBlockedReason: null,
    fulfillmentStatus: "Pending",
    isTerminal: false,
    merchantReference: "pay_1",
    paymentCompletedAtUtc: null,
    paymentExpiresAtUtc: null,
    paymentMethodType: "PaymentLink",
    paymentProviderName: "Bachs",
    paymentStatus: "Initiated",
    purchaseId: PURCHASE_ID,
    shouldContinuePolling: true,
    status: "PaymentPending",
    subscriptionId: "subscription-1",
    subscriptionStatus: "Pending",
    ...overrides,
  };
}

function queryState(
  data: GetSubscriptionPurchaseStatusQueryResponse | undefined,
  overrides: Record<string, unknown> = {},
) {
  return {
    data,
    isError: false,
    isFetching: false,
    isPending: false,
    pollingExhausted: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

function render() {
  return renderToStaticMarkup(
    createElement(PurchaseStatusView, {
      purchaseId: PURCHASE_ID,
      supportEmail: "support@example.com",
    }),
  ).replace(/ /g, " ");
}

beforeEach(() => {
  hooks.useRememberedCheckoutAttempt.mockReturnValue(null);
});

describe("PurchaseStatusView", () => {
  it("reads authoritative status for the purchase and billing owner", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(queryState(status()));
    const markup = render();
    expect(hooks.useSubscriptionPurchaseStatus).toHaveBeenCalledWith(
      PURCHASE_ID,
      "Stakeholder",
    );
    expect(markup).toContain("Waiting for payment");
    expect(markup).toContain("Updating…");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toContain("pay_1");
    expect(markup).not.toContain("Check again");
  });

  it("explains received payment while activation is pending", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(
        status({
          paymentCompletedAtUtc: "2026-11-23T12:05:00Z",
          paymentStatus: "Succeeded",
          status: "PaymentSucceededFulfillmentPending",
        }),
      ),
    );
    const markup = render();
    expect(markup).toContain("Payment received — activating your subscription");
    expect(markup).not.toContain("Subscription active");
  });

  it("confirms an active subscription only when the backend does", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(
        status({
          currentPeriodEndUtc: "2026-12-23T12:05:00Z",
          fulfillmentStatus: "Fulfilled",
          isTerminal: true,
          paymentStatus: "Succeeded",
          shouldContinuePolling: false,
          status: "SubscriptionActive",
          subscriptionStatus: "Active",
        }),
      ),
    );
    const markup = render();
    expect(markup).toContain("Subscription active");
    expect(markup).toContain("View your subscription");
    expect(markup).toContain("Current period ends");
  });

  it.each(["PaymentFailed", "PaymentCancelled", "PaymentExpired"])(
    "offers a new checkout for the remembered plan after %s",
    (outcome) => {
      hooks.useRememberedCheckoutAttempt.mockReturnValue({
        autoRenew: true,
        billingAccountOwnerType: "Stakeholder",
        billingInterval: "Yearly",
        createdAtUtc: "2026-11-23T12:00:00Z",
        idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
        paymentProviderId: "provider-1",
        planId: PLAN_ID,
        purchaseId: PURCHASE_ID,
      });
      hooks.useSubscriptionPurchaseStatus.mockReturnValue(
        queryState(
          status({
            isTerminal: true,
            shouldContinuePolling: false,
            status: outcome,
          }),
        ),
      );
      const markup = render();
      expect(markup).toContain("Start a new checkout");
      expect(markup).toContain(
        `href="/billing/checkout?billingInterval=Yearly&amp;planId=${PLAN_ID}"`,
      );
    },
  );

  it("shows a support-oriented message for blocked fulfillment", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(
        status({
          fulfillmentBlockedAtUtc: "2026-11-23T12:06:00Z",
          isTerminal: true,
          paymentStatus: "Succeeded",
          shouldContinuePolling: false,
          status: "FulfillmentBlocked",
        }),
      ),
    );
    const markup = render();
    expect(markup).toContain("Activation needs attention");
    expect(markup).toContain("does not mean your payment failed");
    expect(markup).toContain("mailto:support@example.com");
    expect(markup).not.toContain("Start a new checkout");
  });

  it("falls back to a processing state with manual refresh at the polling limit", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(status(), { pollingExhausted: true }),
    );
    const markup = render();
    expect(markup).toContain("This is taking longer than usual.");
    expect(markup).toContain("this does not mean it failed");
    expect(markup).toContain("Check again");
    expect(markup).not.toContain("Payment failed");
  });

  it("keeps the last confirmed state when a refresh fails", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(status(), { isError: true }),
    );
    const markup = render();
    expect(markup).toContain("We could not refresh the status just now.");
    expect(markup).toContain("Check again");
    expect(markup).not.toContain("Start a new checkout");
  });

  it("supports direct navigation and refresh with a loading state", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue({ isPending: true });
    expect(render()).toContain("Loading purchase status");
  });

  it("handles purchases outside the billing context and API failures", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(undefined, {
        error: new ApiError({
          kind: "not-found",
          safeMessage: "x",
          status: 404,
        }),
        isError: true,
      }),
    );
    expect(render()).toContain(
      "We could not find this purchase for your account.",
    );

    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(undefined, {
        error: new ApiError({ kind: "server", safeMessage: "x", status: 503 }),
        isError: true,
      }),
    );
    const markup = render();
    expect(markup).toContain("Your payment is not affected.");
    expect(markup).toContain("Try again");
  });

  it("handles unexpected statuses safely", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(
        status({
          isTerminal: true,
          shouldContinuePolling: false,
          status: "SubscriptionPending",
        }),
      ),
    );
    const markup = render();
    expect(markup).toContain("Confirming your purchase");
    expect(markup).toContain("Check again");
  });
});
