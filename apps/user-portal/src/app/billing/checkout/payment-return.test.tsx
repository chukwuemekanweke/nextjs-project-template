import { ApiError } from "@template/api-client";
import type {
  GetSubscriptionPurchaseStatusQueryResponse,
  SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderReturnHint } from "@/lib/payment-return";

const hooks = vi.hoisted(() => ({
  usePurchaseSubscription: vi.fn(),
  useRememberedCheckoutAttempt: vi.fn(),
  useSubscriptionPlans: vi.fn(),
  useSubscriptionPurchaseStatus: vi.fn(),
}));

vi.mock("@template/api-react/subscriptions", () => ({
  usePurchaseSubscription: () => hooks.usePurchaseSubscription(),
  useSubscriptionPlans: () => hooks.useSubscriptionPlans(),
  useSubscriptionPurchaseStatus: (...args: unknown[]) =>
    hooks.useSubscriptionPurchaseStatus(...args),
}));
vi.mock("@/lib/use-checkout-attempt", () => ({
  useRememberedCheckoutAttempt: () => hooks.useRememberedCheckoutAttempt(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { PaymentReturn } from "./payment-return";

const PLAN_ID = "019a0000-0000-7000-8000-000000000001";
const PURCHASE_ID = "019a0000-0000-7000-8000-000000000002";
const RETRY_HREF = `href="/billing/checkout?billingInterval=Monthly&amp;planId=${PLAN_ID}"`;

const plan: SubscriptionPlanResponse = {
  billingInterval: "Monthly",
  code: "PRO_MONTHLY",
  currencyCode: "NGN",
  currencyId: "currency-1",
  id: PLAN_ID,
  name: "Pro Monthly",
  price: 750000,
};

const attempt = {
  autoRenew: true,
  billingAccountOwnerType: "Stakeholder",
  billingInterval: "Monthly",
  createdAtUtc: "2026-11-23T12:00:00Z",
  idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
  paymentProviderId: "provider-link",
  planId: PLAN_ID,
  purchaseId: PURCHASE_ID,
};

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

const active = status({
  fulfillmentStatus: "Fulfilled",
  isTerminal: true,
  paymentStatus: "Succeeded",
  shouldContinuePolling: false,
  status: "SubscriptionActive",
  subscriptionStatus: "Active",
});
const failed = status({
  isTerminal: true,
  paymentStatus: "Failed",
  shouldContinuePolling: false,
  status: "PaymentFailed",
});

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

function render(hint: ProviderReturnHint) {
  return renderToStaticMarkup(
    createElement(PaymentReturn, {
      hint,
      supportEmail: "support@example.com",
    }),
  )
    .replace(/ /g, " ")
    .replace(/&#x27;/g, "'");
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useRememberedCheckoutAttempt.mockReturnValue(attempt);
  hooks.useSubscriptionPlans.mockReturnValue({ data: [plan] });
  hooks.useSubscriptionPurchaseStatus.mockReturnValue(queryState(status()));
});

describe("PaymentReturn success route", () => {
  it("verifies the remembered purchase with the backend for its owner", () => {
    render("success");
    expect(hooks.useSubscriptionPurchaseStatus).toHaveBeenCalledWith(
      PURCHASE_ID,
      "Stakeholder",
    );
  });

  it("shows success with authoritative plan and amount once the subscription is active", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(queryState(active));
    const markup = render("success");
    expect(markup).toContain("Payment successful");
    expect(markup).toContain(
      "Your payment has been received and your subscription is now active.",
    );
    expect(markup).toContain("Pro Monthly");
    expect(markup).toContain("Billed monthly");
    expect(markup).toContain("Amount paid");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toMatch(/href="\/billing"[^>]*>Continue to billing/);
    expect(markup).toMatch(/href="\/dashboard"[^>]*>Go to dashboard/);
    expect(markup).toContain(
      "Secure payment. Processed by our billing service.",
    );
  });

  it("shows activation in progress, not success, while fulfillment is pending", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(
        status({
          paymentStatus: "Succeeded",
          status: "PaymentSucceededFulfillmentPending",
        }),
      ),
    );
    const markup = render("success");
    expect(markup).toContain("Activating your subscription");
    expect(markup).not.toContain("Payment successful");
    expect(markup).not.toContain("is now active");
  });

  it("keeps waiting for a pending payment instead of trusting the redirect", () => {
    const markup = render("success");
    expect(markup).toContain("Confirming your payment");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("Payment successful");
  });

  it("follows a backend failure despite the success redirect", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(queryState(failed));
    const markup = render("success");
    expect(markup).toContain("Payment failed");
    expect(markup).not.toContain("Payment successful");
    expect(markup).toContain(RETRY_HREF);
  });

  it("stays recoverable when polling times out", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(status(), { pollingExhausted: true }),
    );
    const markup = render("success");
    expect(markup).toContain("This is taking longer than usual.");
    expect(markup).toContain("It does not mean your payment failed.");
    expect(markup).toContain("Check again");
    expect(markup).not.toContain('aria-busy="true"');
  });

  it("asks for support when activation is blocked", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(
        status({
          fulfillmentBlockedAtUtc: "2026-11-23T12:05:00Z",
          isTerminal: true,
          paymentStatus: "Succeeded",
          shouldContinuePolling: false,
          status: "FulfillmentBlocked",
        }),
      ),
    );
    const markup = render("success");
    expect(markup).toContain("Activation needs attention");
    expect(markup).toContain('href="mailto:support@example.com"');
    expect(markup).toContain("pay_1");
  });
});

describe("PaymentReturn cancelled route", () => {
  it("shows a confirmed cancellation with a retry that does not purchase", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(
        status({
          isTerminal: true,
          paymentStatus: "Cancelled",
          shouldContinuePolling: false,
          status: "PaymentCancelled",
        }),
      ),
    );
    const markup = render("cancelled");
    expect(markup).toContain("Payment cancelled");
    expect(markup).toContain(
      "No payment was completed, and your subscription was not activated.",
    );
    expect(markup).toContain("Pro Monthly");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toMatch(
      new RegExp(
        `${RETRY_HREF.replace(/[?]/g, "\\?")}[^>]*>Return to checkout`,
      ),
    );
    expect(markup).toMatch(/href="\/dashboard"[^>]*>Go to dashboard/);
    expect(hooks.usePurchaseSubscription).not.toHaveBeenCalled();
  });

  it("treats a Bachs cancellation recorded as a failed payment as cancelled", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(queryState(failed));
    expect(render("cancelled")).toContain("Payment cancelled");
  });

  it("does not declare cancellation while the payment is still pending", () => {
    const markup = render("cancelled");
    expect(markup).toContain("Payment not completed");
    expect(markup).not.toContain("Payment cancelled");
    expect(markup).not.toContain("No payment was completed");
    expect(markup).toContain(RETRY_HREF);
  });

  it("follows a backend success despite the cancel redirect", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(queryState(active));
    const markup = render("cancelled");
    expect(markup).toContain("Payment successful");
    expect(markup).not.toContain("Payment cancelled");
  });
});

describe("PaymentReturn checkout context", () => {
  it("waits for the remembered checkout while hydrating", () => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue(undefined);
    const markup = render("success");
    expect(markup).toContain("Confirming your payment");
    expect(hooks.useSubscriptionPurchaseStatus).not.toHaveBeenCalled();
  });

  it.each([
    ["no remembered checkout", null],
    [
      "a checkout the backend never accepted",
      { ...attempt, purchaseId: undefined },
    ],
    [
      "a checkout for another billing owner",
      { ...attempt, billingAccountOwnerType: "Tenant" },
    ],
  ])("recovers safely from %s", (_label, remembered) => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue(remembered);
    const markup = render("success");
    expect(markup).toContain("We couldn't find your checkout");
    expect(markup).not.toContain("Payment successful");
    expect(markup).toMatch(/href="\/billing"[^>]*>Go to billing/);
    expect(hooks.useSubscriptionPurchaseStatus).not.toHaveBeenCalled();
    expect(hooks.usePurchaseSubscription).not.toHaveBeenCalled();
  });

  it("explains a purchase the backend does not recognise for this account", () => {
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
    const markup = render("cancelled");
    expect(markup).toContain("We couldn't find this checkout");
    expect(markup).not.toContain("Try again");
  });

  it("offers a retry when the status cannot be read", () => {
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(
      queryState(undefined, { error: new Error("offline"), isError: true }),
    );
    const markup = render(undefined);
    expect(markup).toContain("We couldn't check your payment");
    expect(markup).toContain("Try again");
    expect(markup).toContain("This does not affect your payment.");
  });

  it("shows the summary without a plan name when the plan is no longer listed", () => {
    hooks.useSubscriptionPlans.mockReturnValue({ data: [] });
    hooks.useSubscriptionPurchaseStatus.mockReturnValue(queryState(active));
    const markup = render("success");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).not.toContain("Pro Monthly");
  });
});
