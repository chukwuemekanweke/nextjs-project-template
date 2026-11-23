import type { SubscriptionPlanResponse } from "@template/api-client/subscriptions";
import { ApiError } from "@template/api-client";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useEligiblePaymentProviders: vi.fn(),
  usePurchaseSubscription: vi.fn(),
  useRememberedCheckoutAttempt: vi.fn(),
  useSubscriptionPlans: vi.fn(),
}));

vi.mock("@template/api-react/subscriptions", () => ({
  useEligiblePaymentProviders: (...args: unknown[]) =>
    hooks.useEligiblePaymentProviders(...args),
  usePurchaseSubscription: () => hooks.usePurchaseSubscription(),
  useSubscriptionPlans: () => hooks.useSubscriptionPlans(),
}));
vi.mock("@/lib/use-checkout-attempt", () => ({
  useRememberedCheckoutAttempt: () => hooks.useRememberedCheckoutAttempt(),
}));

import { CheckoutView } from "./checkout-view";
import { PaymentInstructions } from "./payment-instructions";

const PLAN_ID = "019a0000-0000-7000-8000-000000000001";
const plan: SubscriptionPlanResponse = {
  billingInterval: "Monthly",
  code: "PRO_MONTHLY",
  currencyCode: "NGN",
  currencyId: "currency-1",
  id: PLAN_ID,
  name: "Pro Monthly",
  price: 750000,
};
const linkProvider = {
  id: "provider-link",
  name: "Bachs",
  paymentMethodType: "PaymentLink",
  supportsRecurringPayments: true,
};
const cardProvider = {
  id: "provider-card",
  name: "CardCo",
  paymentMethodType: "Card",
  supportsRecurringPayments: false,
};

function render() {
  return renderToStaticMarkup(
    createElement(CheckoutView, { planId: PLAN_ID }),
  ).replace(/ /g, " ");
}

beforeEach(() => {
  hooks.useSubscriptionPlans.mockReturnValue({
    data: [plan],
    isPending: false,
  });
  hooks.useEligiblePaymentProviders.mockReturnValue({
    data: [linkProvider, cardProvider],
    isPending: false,
  });
  hooks.usePurchaseSubscription.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
  hooks.useRememberedCheckoutAttempt.mockReturnValue(null);
});

describe("CheckoutView", () => {
  it("shows authoritative plan details and discovers providers for the billing owner", () => {
    const markup = render();
    expect(markup).toContain("Pro Monthly");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toContain("Billed monthly in NGN.");
    expect(hooks.useEligiblePaymentProviders).toHaveBeenCalledWith(
      PLAN_ID,
      "Stakeholder",
    );
    expect(markup).not.toMatch(/name="(amount|currency)/);
  });

  it("lists providers and disables methods the portal cannot complete", () => {
    const markup = render();
    expect(markup).toContain("<legend");
    expect(markup).toMatch(/value="provider-link"/);
    expect(markup).toMatch(
      /<input[^>]*disabled=""[^>]*value="provider-card"|<input[^>]*value="provider-card"[^>]*disabled=""/,
    );
    expect(markup).toContain("Card is not available in this portal yet");
  });

  it("keeps submission disabled until a supported provider is selected", () => {
    const markup = render();
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*type="submit"/);
  });

  it("restores an interrupted attempt's selection so retries reuse its key", () => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: false,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
      paymentProviderId: "provider-link",
      planId: PLAN_ID,
      purchaseId: "019a0000-0000-7000-8000-000000000002",
    });
    const markup = render();
    expect(markup).toMatch(/checked=""[^>]*value="provider-link"/);
    expect(markup).not.toMatch(/checked=""[^>]*name="autoRenew"/);
    expect(markup).toContain("You already started a checkout for this plan.");
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Pay NGN 7,500.00/);
    expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*type="submit"/);
  });

  it("prevents duplicate submissions while a purchase is pending", () => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: true,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
      paymentProviderId: "provider-link",
      planId: PLAN_ID,
    });
    hooks.usePurchaseSubscription.mockReturnValue({
      isPending: true,
      mutateAsync: vi.fn(),
    });
    const markup = render();
    expect(markup).toContain("Starting checkout…");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*type="submit"/);
    expect(markup).toContain('aria-busy="true"');
  });

  it("falls back to plan selection for an unavailable plan", () => {
    hooks.useSubscriptionPlans.mockReturnValue({ data: [], isPending: false });
    expect(render()).toContain("The selected plan is no longer available.");
  });

  it("explains ineligible plans and empty provider lists", () => {
    hooks.useEligiblePaymentProviders.mockReturnValue({
      error: new ApiError({ kind: "not-found", safeMessage: "x", status: 404 }),
      isError: true,
      isPending: false,
    });
    expect(render()).toContain(
      "This plan is no longer available for purchase.",
    );

    hooks.useEligiblePaymentProviders.mockReturnValue({
      data: [],
      isPending: false,
    });
    expect(render()).toContain(
      "No payment methods are available for this plan in your region.",
    );
  });

  it("shows loading and plan errors", () => {
    hooks.useSubscriptionPlans.mockReturnValue({ isPending: true });
    expect(render()).toContain("Loading checkout");
    hooks.useSubscriptionPlans.mockReturnValue({
      error: new Error("boom"),
      isError: true,
      isPending: false,
    });
    expect(render()).toContain("Subscription plans could not be loaded.");
  });
});

describe("PaymentInstructions", () => {
  const response = {
    expiresAtUtc: "2026-11-23T13:00:00Z",
    instructionFields: {},
    merchantReference: "pay_1",
    paymentMethodType: "PaymentLink",
    paymentProviderId: "provider-link",
    paymentProviderName: "Bachs",
    paymentStatus: "Initiated",
    purchaseId: "019a0000-0000-7000-8000-000000000002",
    subscriptionId: "subscription-1",
  };
  const renderOutcome = (
    outcome: Parameters<typeof PaymentInstructions>[0]["outcome"],
  ) =>
    renderToStaticMarkup(
      createElement(PaymentInstructions, { amount: "NGN 7,500.00", outcome }),
    );

  it("offers the hosted checkout link and a status fallback", () => {
    const markup = renderOutcome({
      href: "https://provider.example/checkout/1",
      response,
      type: "redirect",
    });
    expect(markup).toContain('href="https://provider.example/checkout/1"');
    expect(markup).toContain(
      `href="/billing/purchases/${response.purchaseId}"`,
    );
  });

  it("renders bank-transfer details and references", () => {
    const markup = renderOutcome({
      response: {
        ...response,
        instructionFields: {
          accountName: "Template Ltd",
          accountNumber: "0123456789",
          bankName: "Example Bank",
          providerReference: "ref-1",
        },
        paymentMethodType: "BankTransfer",
      },
      type: "bank-transfer",
    });
    expect(markup).toContain("0123456789");
    expect(markup).toContain("Example Bank");
    expect(markup).toContain("ref-1");
    expect(markup).toContain("pay_1");
    expect(markup).toContain("check status");
  });

  it("does not fabricate a flow for unsupported methods", () => {
    const markup = renderOutcome({
      response: { ...response, paymentMethodType: "Card" },
      type: "unsupported",
    });
    expect(markup).toContain("cannot be completed in this portal yet");
    expect(markup).not.toContain("provider.example");
  });
});
