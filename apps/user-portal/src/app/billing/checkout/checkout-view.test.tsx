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
import { PaymentMethodCard } from "./payment-method-selector";
import { ProviderRedirect } from "./provider-redirect";

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

const AUTO_RENEW = 'name="autoRenew"';

/** Matches an <input> carrying every literal attribute, in any order. */
function inputWith(...attributes: string[]) {
  const lookaheads = attributes
    .map((attribute) => `(?=[^>]*${attribute})`)
    .join("");
  return new RegExp(`<input${lookaheads}[^>]*>`);
}

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
    expect(markup).toMatch(inputWith('value="provider-link"', 'checked=""'));
    expect(markup).not.toMatch(inputWith(AUTO_RENEW, 'checked=""'));
    expect(markup).toContain("You already started a checkout for this plan.");
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Pay NGN 7,500.00/);
    expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*type="submit"/);
  });

  it("does not purchase or redirect again when the page is refreshed after initiation", () => {
    const mutateAsync = vi.fn();
    hooks.usePurchaseSubscription.mockReturnValue({
      isPending: false,
      mutateAsync,
    });
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: true,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
      paymentProviderId: "provider-link",
      planId: PLAN_ID,
      purchaseId: "019a0000-0000-7000-8000-000000000002",
    });
    const markup = render();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(markup).not.toContain("Taking you to");
    expect(markup).toContain("You already started a checkout for this plan.");
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

  it("renders the order summary from the authoritative plan", () => {
    const markup = render();
    expect(markup).toContain("Order summary");
    expect(markup).toMatch(/Subtotal<\/dt><dd[^>]*>NGN 7,500.00/);
    expect(markup).toMatch(/Billing frequency<\/dt><dd[^>]*>Monthly/);
    expect(markup).toMatch(/Due today<\/dt><dd[^>]*>NGN 7,500.00/);
    expect(markup).toContain("/ month");
    expect(markup).not.toMatch(/tax|discount|fee/i);
  });

  it("renders backend providers as selectable cards with a distinct selected state", () => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: true,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
      paymentProviderId: "provider-link",
      planId: PLAN_ID,
    });
    const markup = render();
    expect(markup).toContain("Bachs");
    expect(markup).toContain("Hosted checkout");
    expect(markup).toContain("CardCo");
    expect(markup.match(/data-selected="true"/g)).toHaveLength(1);
    expect(markup).toMatch(
      /data-selected="true"><input[^>]*value="provider-link"/,
    );
    expect(markup).toContain(
      "Choose how you would like to pay for Pro Monthly.",
    );
  });

  it("describes renewal using the plan's billing interval and the chosen preference", () => {
    hooks.useSubscriptionPlans.mockReturnValue({
      data: [{ ...plan, billingInterval: "Yearly", name: "Pro Yearly" }],
      isPending: false,
    });
    let markup = render();
    expect(markup).toMatch(inputWith(AUTO_RENEW, 'checked=""'));
    expect(markup).toContain("Renew automatically at the end of each year");
    expect(markup).toContain("Yearly subscription");
    expect(markup).toContain("Renews automatically each year.");
    expect(markup).toContain("/ year");

    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: false,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
      paymentProviderId: "provider-link",
      planId: PLAN_ID,
    });
    markup = render();
    expect(markup).toContain("Does not renew automatically.");
    expect(markup).toContain("Access ends at the end of the paid year");
    expect(markup).not.toContain("Renews automatically each year.");
  });

  it("pre-selects a settled attempt's choices without reusing its checkout", () => {
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: false,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
      paymentProviderId: "provider-link",
      planId: PLAN_ID,
      purchaseId: "019a0000-0000-7000-8000-000000000002",
      settledAtUtc: "2026-11-23T12:30:00Z",
    });
    const markup = render();
    expect(markup).toMatch(inputWith('value="provider-link"', 'checked=""'));
    expect(markup).not.toMatch(inputWith(AUTO_RENEW, 'checked=""'));
    expect(markup).not.toContain("You already started a checkout");
    expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*type="submit"/);
  });

  it("does not promise renewal through a provider without recurring payments", () => {
    const nonRecurring = { ...linkProvider, supportsRecurringPayments: false };
    hooks.useEligiblePaymentProviders.mockReturnValue({
      data: [nonRecurring],
      isPending: false,
    });
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: true,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10",
      paymentProviderId: "provider-link",
      planId: PLAN_ID,
    });
    const markup = render();
    expect(markup).toContain(
      "Bachs does not support automatic recurring charges.",
    );
    expect(markup).toContain("Does not renew automatically.");
    expect(markup).not.toContain("Renews automatically each month.");
  });

  it("disables provider selection and shows progress while purchasing", () => {
    hooks.usePurchaseSubscription.mockReturnValue({
      isPending: true,
      mutateAsync: vi.fn(),
    });
    const markup = render();
    expect(markup).toMatch(/<fieldset[^>]*disabled=""/);
    expect(markup).toMatch(inputWith(AUTO_RENEW, 'disabled=""'));
    expect(markup).not.toContain("Pay NGN 7,500.00");
  });

  it("states who processes the payment without overclaiming", () => {
    expect(render()).toContain(
      "Secure payment. Your payment is processed by our billing service.",
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

describe("PaymentMethodCard", () => {
  type Node = {
    props?: Record<string, unknown> & { children?: unknown };
    type?: unknown;
  };
  function findInput(node: unknown): Node | undefined {
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = findInput(child);
        if (found) return found;
      }
      return undefined;
    }
    if (!node || typeof node !== "object") return undefined;
    const element = node as Node;
    if (element.type === "input") return element;
    return findInput(element.props?.children);
  }

  it("selects the provider when its radio changes", () => {
    const onSelect = vi.fn();
    const element = PaymentMethodCard({
      checked: false,
      onSelect,
      provider: linkProvider,
    });
    const input = findInput(element);
    expect(input?.props?.name).toBe("paymentProviderId");
    (input?.props?.onChange as () => void)();
    expect(onSelect).toHaveBeenCalledWith("provider-link");
  });

  it("marks the selected provider with more than color", () => {
    const selected = renderToStaticMarkup(
      createElement(PaymentMethodCard, {
        checked: true,
        onSelect: vi.fn(),
        provider: linkProvider,
      }),
    );
    expect(selected).toContain('data-selected="true"');
    expect(selected).toContain("checked=");
    expect(selected).toContain("font-semibold");
  });
});

describe("ProviderRedirect", () => {
  const href = "https://provider.example/checkout/1";
  const renderRedirect = (fallbackDelayMs?: number) =>
    renderToStaticMarkup(
      createElement(ProviderRedirect, {
        fallbackDelayMs,
        href,
        providerName: "Bachs",
      }),
    ).replace(/&#x27;/g, "'");

  it("shows a minimal redirect state without identifiers or a status check", () => {
    const markup = renderRedirect();
    expect(markup).toContain("Taking you to Bachs");
    expect(markup).toContain("You'll return here after checkout.");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("pay_1");
    expect(markup).not.toContain("Reference");
    expect(markup).not.toContain("Check payment status");
    expect(markup).not.toContain("/billing/purchases/");
  });

  it("waits for automatic navigation before offering the manual link", () => {
    expect(renderRedirect()).not.toContain(`href="${href}"`);
  });

  it("offers the backend link as a fallback once automatic navigation stalls", () => {
    const markup = renderRedirect(0);
    expect(markup).toContain("If the redirect doesn't happen automatically");
    expect(markup).toMatch(new RegExp(`href="${href}"[^>]*>Continue to Bachs`));
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

  it("explains an unusable payment link instead of redirecting", () => {
    const markup = renderOutcome({ response, type: "unsupported" }).replace(
      /&#x27;/g,
      "'",
    );
    expect(markup).toContain("We couldn't open Bachs's checkout page.");
    expect(markup).not.toContain("cannot be completed in this portal yet");
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

describe("CheckoutView billing intervals", () => {
  const multiInterval: SubscriptionPlanResponse = {
    code: "PRO",
    currencyCode: "NGN",
    currencyId: "currency-1",
    id: PLAN_ID,
    name: "Pro",
    prices: [
      { billingInterval: "Monthly", price: 750000 },
      { billingInterval: "Yearly", price: 7500000 },
    ],
  };
  const renderWith = (billingInterval?: string) =>
    renderToStaticMarkup(
      createElement(CheckoutView, { billingInterval, planId: PLAN_ID }),
    ).replace(/ /g, " ");

  beforeEach(() => {
    hooks.useSubscriptionPlans.mockReturnValue({
      data: [multiInterval],
      isPending: false,
    });
  });

  it("preselects the requested interval and prices it from the backend", () => {
    const markup = renderWith("Yearly");
    expect(markup).toMatch(
      inputWith('name="billingInterval"', 'value="Yearly"', 'checked=""'),
    );
    expect(markup).toContain("Pay NGN 75,000.00");
    expect(markup).toContain("/ year");
    expect(markup).toContain("Renew automatically at the end of each year");
  });

  it("ignores an interval the plan does not offer and defaults to monthly", () => {
    const markup = renderWith("Weekly");
    expect(markup).toMatch(
      inputWith('name="billingInterval"', 'value="Monthly"', 'checked=""'),
    );
    expect(markup).toContain("Pay NGN 7,500.00");
  });

  it("hides the selector when the plan offers one interval", () => {
    hooks.useSubscriptionPlans.mockReturnValue({
      data: [
        {
          ...multiInterval,
          prices: [{ billingInterval: "Yearly", price: 7500000 }],
        },
      ],
      isPending: false,
    });
    const markup = renderWith("Monthly");
    expect(markup).not.toContain('name="billingInterval"');
    expect(markup).toContain("Pay NGN 75,000.00");
  });

  it("falls back to the plan picker when a plan offers no prices", () => {
    hooks.useSubscriptionPlans.mockReturnValue({
      data: [{ ...multiInterval, prices: [] }],
      isPending: false,
    });
    expect(renderWith()).toContain("The selected plan is no longer available.");
  });
});
