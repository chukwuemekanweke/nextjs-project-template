import { ApiError } from "@template/api-client";
import type {
  BillingHistoryItemResponse,
  GetCurrentSubscriptionQueryResponse,
  SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useBillingHistory: vi.fn(),
  useCancelSubscriptionAtPeriodEnd: vi.fn(),
  useCurrentSubscription: vi.fn(),
  useRememberedCheckoutAttempt: vi.fn(),
  useSubscriptionPlans: vi.fn(),
}));

// Purchase hooks are deliberately absent: the Billing page must never start a
// purchase, so calling one would fail these tests.
vi.mock("@template/api-react/subscriptions", () => ({
  DEFAULT_BILLING_HISTORY_PAGE_SIZE: 20,
  useBillingHistory: (...args: unknown[]) => hooks.useBillingHistory(...args),
  useCancelSubscriptionAtPeriodEnd: () =>
    hooks.useCancelSubscriptionAtPeriodEnd(),
  useCurrentSubscription: (...args: unknown[]) =>
    hooks.useCurrentSubscription(...args),
  useSubscriptionPlans: () => hooks.useSubscriptionPlans(),
}));

vi.mock("@/lib/use-checkout-attempt", () => ({
  useRememberedCheckoutAttempt: () => hooks.useRememberedCheckoutAttempt(),
}));

import {
  BillingHistoryCard,
  billingHistoryPageHref,
  copyText,
} from "./billing-history-card";
import { BillingOverview } from "./billing-overview";
import { SubscriptionPlanGrid } from "./subscription-plan-grid";

function subscription(
  overrides: Partial<GetCurrentSubscriptionQueryResponse> = {},
): GetCurrentSubscriptionQueryResponse {
  return {
    autoRenew: true,
    billingAccountId: "account-1",
    billingInterval: "Monthly",
    cancelAtPeriodEnd: false,
    cancellationEffectiveAtUtc: null,
    cancellationRequestedAtUtc: null,
    currencyCode: "NGN",
    currencyId: "currency-1",
    currentPeriodEndUtc: "2026-12-23T12:05:00Z",
    currentPeriodStartUtc: "2026-11-23T12:05:00Z",
    id: "subscription-1",
    lifecycleStatus: "Active",
    nextBillingAtUtc: "2026-12-22T12:05:00Z",
    planCode: "PRO_MONTHLY",
    planId: "plan-1",
    planName: "Pro Monthly",
    planPrice: 750000,
    status: "Active",
    ...overrides,
  };
}

function plan(
  index: number,
  overrides: Partial<SubscriptionPlanResponse> = {},
): SubscriptionPlanResponse {
  return {
    billingInterval: index % 2 === 0 ? "Monthly" : "Yearly",
    code: `PLAN_${index}`,
    currencyCode: "NGN",
    currencyId: "currency-1",
    id: `00000000-0000-4000-8000-00000000000${index}`,
    name: `Plan ${index}`,
    price: 500000 * (index + 1),
    ...overrides,
  };
}
const plans = (count: number) =>
  Array.from({ length: count }, (_, index) => plan(index));

function historyItem(
  overrides: Partial<BillingHistoryItemResponse> = {},
): BillingHistoryItemResponse {
  return {
    amount: 750000,
    billingPeriodEndUtc: "2026-12-23T12:05:00Z",
    billingPeriodStartUtc: "2026-11-23T12:05:00Z",
    createdAtUtc: "2026-11-23T12:00:00Z",
    currencyCode: "NGN",
    merchantReference: "pay_1",
    paidAtUtc: "2026-11-23T12:05:00Z",
    paymentProviderName: "Bachs",
    paymentStatus: "Succeeded",
    paymentTransactionId: "tx-1",
    planCode: "PRO_MONTHLY",
    planName: "Pro Monthly",
    subscriptionId: "subscription-1",
    ...overrides,
  };
}

function historyPage(
  items: BillingHistoryItemResponse[],
  { page = 1, totalCount = items.length } = {},
) {
  return {
    data: { items, page, pageSize: 20, totalCount },
    isPending: false,
  };
}

const normalize = (markup: string) => markup.replace(/ /g, " ");
const renderOverview = (page = 1) =>
  normalize(
    renderToStaticMarkup(
      createElement(BillingOverview, {
        eyebrow: "User Portal",
        page,
        supportEmail: "support@example.com",
      }),
    ),
  );
const renderHistory = (page = 1, basePath?: string) =>
  normalize(
    renderToStaticMarkup(
      createElement(BillingHistoryCard, {
        page,
        ...(basePath ? { basePath } : {}),
      }),
    ),
  );

function givenCurrent(value: unknown) {
  hooks.useCurrentSubscription.mockReturnValue({
    isFetching: false,
    refetch: vi.fn(),
    ...(value as object),
  });
}

const SEVEN_COLUMNS = [
  "Date",
  "Plan",
  "Billing period",
  "Amount",
  "Status",
  "Provider",
  "Reference",
];

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useCancelSubscriptionAtPeriodEnd.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
  hooks.useRememberedCheckoutAttempt.mockReturnValue(null);
  hooks.useBillingHistory.mockReturnValue(historyPage([]));
  hooks.useSubscriptionPlans.mockReturnValue({
    data: plans(2),
    isPending: false,
  });
});

describe("Billing overview: subscription state", () => {
  it("shows loading without a no-subscription state or plans", () => {
    givenCurrent({ isPending: true });
    const markup = renderOverview();
    expect(markup).toContain("Loading subscription");
    expect(markup).not.toContain("Choose plan");
    expect(hooks.useSubscriptionPlans).not.toHaveBeenCalled();
  });

  it.each([401, 403, 500])(
    "does not show a false empty state for a %s error",
    (status) => {
      givenCurrent({
        error: new ApiError({ kind: "server", safeMessage: "x", status }),
        isError: true,
        isPending: false,
      });
      const markup = renderOverview();
      expect(markup).toContain('data-billing-view="error"');
      expect(markup).not.toContain("Choose plan");
      expect(markup).toContain("Try again");
    },
  );

  it("shows plans when there is no subscription", () => {
    givenCurrent({ data: null, isPending: false });
    const markup = renderOverview();
    expect(hooks.useCurrentSubscription).toHaveBeenCalledWith("Stakeholder");
    expect(markup).toContain(
      "Choose the subscription that works best for you.",
    );
    expect(markup).toContain("Choose plan");
  });

  it("shows an active subscription with its dates and history, without fetching plans", () => {
    givenCurrent({ data: subscription(), isPending: false });
    hooks.useBillingHistory.mockReturnValue(historyPage([historyItem()]));
    const markup = renderOverview();
    expect(hooks.useSubscriptionPlans).not.toHaveBeenCalled();
    expect(markup).toContain(
      "Manage your subscription, renewal, and payments.",
    );
    expect(markup).toContain("Current subscription");
    expect(markup).toContain("Pro Monthly");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toContain("/ month");
    expect(markup).toMatch(/data-tone="success"[^>]*>Active</);
    expect(markup).toContain("Current period ends");
    expect(markup).toContain("Dec 23, 2026");
    expect(markup).toContain("Next billing date");
    expect(markup).toContain("Dec 22, 2026");
    expect(markup).toContain("Enabled");
    expect(markup).toContain('data-subscription-status="Active"');
    expect(markup).toContain("Billing history");
    expect(markup).not.toContain("Choose plan");
  });

  it("does not offer an upgrade the backend cannot complete", () => {
    givenCurrent({ data: subscription(), isPending: false });
    const markup = renderOverview();
    expect(markup).not.toMatch(/<(a|button)[^>]*>[^<]*Upgrade/);
    expect(markup).toContain("Plan changes are not available yet.");
  });

  it("requires confirmation before cancelling", () => {
    givenCurrent({ data: subscription(), isPending: false });
    const markup = renderOverview();
    expect(markup).toContain("Cancel at period end");
    expect(markup).not.toContain('role="dialog"');
    expect(
      hooks.useCancelSubscriptionAtPeriodEnd.mock.results[0]?.value.mutateAsync,
    ).not.toHaveBeenCalled();
  });

  it("presents past-due subscriptions with a renewal warning and history", () => {
    givenCurrent({
      data: subscription({ lifecycleStatus: "PastDue" }),
      isPending: false,
    });
    const markup = renderOverview();
    expect(markup).toContain("Past due");
    expect(markup).toContain("renewal payment has not been settled");
    expect(markup).toContain("Billing history");
  });

  it("shows the scheduled cancellation date without offering cancellation again", () => {
    givenCurrent({
      data: subscription({
        autoRenew: false,
        cancelAtPeriodEnd: true,
        cancellationEffectiveAtUtc: "2026-12-23T12:05:00Z",
        cancellationRequestedAtUtc: "2026-11-30T09:00:00Z",
      }),
      isPending: false,
    });
    const markup = renderOverview();
    expect(markup).toContain('data-billing-view="subscription"');
    expect(markup).toContain("Cancellation scheduled");
    expect(markup).toContain("Cancellation effective");
    expect(markup).toContain("You keep access until Dec 23, 2026.");
    expect(markup).toContain("Nov 30, 2026");
    expect(markup).not.toContain("Next billing date");
    expect(markup).not.toContain("Cancel at period end");
    expect(markup).not.toContain("Choose plan");
  });

  it("shows a pending purchase with recovery, history, and no new-purchase actions", () => {
    givenCurrent({
      data: subscription({ lifecycleStatus: "Pending", status: "Pending" }),
      isPending: false,
    });
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      autoRenew: true,
      billingAccountOwnerType: "Stakeholder",
      createdAtUtc: "2026-11-23T12:00:00Z",
      idempotencyKey: "key-1",
      paymentProviderId: "provider-1",
      planId: "plan-1",
      purchaseId: "11111111-1111-4111-8111-111111111111",
    });
    hooks.useBillingHistory.mockReturnValue(
      historyPage([
        historyItem({ paidAtUtc: null, paymentStatus: "Initiated" }),
      ]),
    );
    const markup = renderOverview();
    expect(markup).toContain('data-billing-view="pending"');
    expect(markup).toContain("waiting for your payment provider");
    expect(markup).toContain(
      'href="/billing/purchases/11111111-1111-4111-8111-111111111111"',
    );
    expect(markup).toContain("Check again");
    expect(markup).toContain("mailto:support@example.com");
    expect(markup).toContain("Billing history");
    expect(markup).not.toContain("Choose plan");
    expect(markup).not.toContain("/billing/checkout");
    expect(markup).not.toContain("Cancel at period end");
    expect(hooks.useSubscriptionPlans).not.toHaveBeenCalled();
  });

  it("does not link a pending purchase to an unrelated remembered attempt", () => {
    givenCurrent({
      data: subscription({ lifecycleStatus: "Pending", status: "Pending" }),
      isPending: false,
    });
    hooks.useRememberedCheckoutAttempt.mockReturnValue({
      planId: "another-plan",
      purchaseId: "11111111-1111-4111-8111-111111111111",
    });
    expect(renderOverview()).not.toContain("View payment status");
  });
});

describe("Billing overview: plan count and history visibility", () => {
  beforeEach(() => givenCurrent({ data: null, isPending: false }));

  it.each([
    [1, "single"],
    [2, "pair"],
    [3, "grid"],
    [4, "grid"],
    [6, "grid"],
  ] as const)("renders %s plans with the %s layout", (count, layout) => {
    hooks.useSubscriptionPlans.mockReturnValue({
      data: plans(count),
      isPending: false,
    });
    const markup = renderOverview();
    expect(markup).toContain(`data-plan-layout="${layout}"`);
    expect(markup.match(/>Choose plan</g)).toHaveLength(count);
  });

  it("uses responsive columns without page overflow", () => {
    hooks.useSubscriptionPlans.mockReturnValue({
      data: plans(4),
      isPending: false,
    });
    const markup = renderOverview();
    expect(markup).toContain("grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3");
  });

  it("shows loading, error, and empty plan states", () => {
    hooks.useSubscriptionPlans.mockReturnValue({ isPending: true });
    expect(renderOverview()).toContain("Loading plans");

    hooks.useSubscriptionPlans.mockReturnValue({
      error: new ApiError({ kind: "server", safeMessage: "x", status: 500 }),
      isError: true,
      isPending: false,
    });
    expect(renderOverview()).toContain(
      "Subscription plans could not be loaded. Refresh and try again.",
    );

    hooks.useSubscriptionPlans.mockReturnValue({ data: [], isPending: false });
    expect(renderOverview()).toContain(
      "No subscription plans are available right now.",
    );
  });

  it("hides history when there are no records", () => {
    hooks.useBillingHistory.mockReturnValue(historyPage([]));
    const markup = renderOverview();
    expect(markup).not.toContain("Billing history");
    expect(markup).not.toContain("No billing activity yet.");
    expect(markup).not.toContain("after you activate");
  });

  it.each([1, 2])(
    "shows history below %s plans when records exist",
    (count) => {
      hooks.useSubscriptionPlans.mockReturnValue({
        data: plans(count),
        isPending: false,
      });
      hooks.useBillingHistory.mockReturnValue(historyPage([historyItem()]));
      const markup = renderOverview();
      expect(markup).toContain("Billing history");
      for (const column of SEVEN_COLUMNS)
        expect(markup).toContain(`>${column}<`);
      expect(markup).not.toContain('href="/billing/history"');
    },
  );

  it("links to history instead of the table with three or more plans", () => {
    hooks.useSubscriptionPlans.mockReturnValue({
      data: plans(3),
      isPending: false,
    });
    hooks.useBillingHistory.mockReturnValue(historyPage([historyItem()]));
    const markup = renderOverview();
    expect(markup).not.toContain("<table");
    expect(markup).toContain('href="/billing/history"');
    expect(markup).toContain("View billing history");
  });

  it("shows history for an active subscription regardless of plan count", () => {
    givenCurrent({ data: subscription(), isPending: false });
    hooks.useSubscriptionPlans.mockReturnValue({
      data: plans(5),
      isPending: false,
    });
    hooks.useBillingHistory.mockReturnValue(historyPage([historyItem()]));
    const markup = renderOverview();
    expect(markup).toContain("<table");
    expect(markup).not.toContain('href="/billing/history"');
  });
});

describe("SubscriptionPlanGrid", () => {
  it("links each plan to checkout with its id and authoritative price", () => {
    const markup = normalize(
      renderToStaticMarkup(
        createElement(SubscriptionPlanGrid, {
          plans: [plan(0, { price: 500000 }), plan(1, { price: 5000000 })],
        }),
      ),
    );
    expect(markup).toContain(
      'href="/billing/checkout?billingInterval=Monthly&amp;planId=00000000-0000-4000-8000-000000000000"',
    );
    expect(markup).toContain(
      'href="/billing/checkout?billingInterval=Yearly&amp;planId=00000000-0000-4000-8000-000000000001"',
    );
    expect(markup).toContain("NGN 5,000.00");
    expect(markup).toContain("NGN 50,000.00");
    expect(markup).toContain("/ month");
    expect(markup).toContain("Billed yearly");
    expect(markup).toContain('aria-label="Choose Plan 0"');
  });

  it("formats zero-decimal currencies without assuming two decimals", () => {
    const markup = normalize(
      renderToStaticMarkup(
        createElement(SubscriptionPlanGrid, {
          plans: [plan(0, { currencyCode: "JPY", price: 1200 })],
        }),
      ),
    );
    expect(markup).toMatch(/¥1,200<|JPY 1,200</);
  });

  it("fills every card with placeholder copy until the API provides it", () => {
    // Every layout uses the same full pricing card as the three-plan design.
    const pair = renderToStaticMarkup(
      createElement(SubscriptionPlanGrid, { plans: plans(2) }),
    );
    expect(pair.match(/<h2 class="mt-5[^"]*text-2xl/g)).toHaveLength(2);
    expect(pair.match(/<hr /g)).toHaveLength(2);
    expect(pair.match(/Everything you need to get started\./g)).toHaveLength(2);
    expect(pair.match(/>Email support</g)).toHaveLength(2);
    // Pills fall back to the backend interval; no plan is assumed popular.
    expect(pair).toContain(">Monthly<");
    expect(pair).toContain(">Yearly<");
    expect(pair).not.toContain("Most popular");
  });

  it("prefers API presentation fields over configuration and placeholders", () => {
    const markup = renderToStaticMarkup(
      createElement(SubscriptionPlanGrid, {
        plans: [
          plan(0, {
            badge: "Starter",
            description: "From the API.",
            features: ["API feature"],
          }),
          plan(1, { recommended: true }),
          plan(2),
        ],
        presentation: {
          PLAN_0: { description: "From config.", features: ["Config"] },
          PLAN_2: { badge: "Business", features: ["Config feature"] },
        },
      }),
    );
    expect(markup).toContain(">Starter<");
    expect(markup).toContain("From the API.");
    expect(markup).toContain("API feature");
    expect(markup).not.toContain("From config.");
    expect(markup.match(/Most popular/g)).toHaveLength(1);
    expect(markup).toContain(">Business<");
    expect(markup).toContain("Config feature");
  });
});

describe("SubscriptionPlanGrid billing intervals", () => {
  const pricedPlan = (
    index: number,
    prices: SubscriptionPlanResponse["prices"],
  ): SubscriptionPlanResponse => ({
    code: `PKG_${index}`,
    currencyCode: "NGN",
    currencyId: "currency-1",
    id: `00000000-0000-4000-8000-00000000010${index}`,
    name: `Package ${index}`,
    prices,
  });

  it("offers an interval toggle and shows monthly prices by default", () => {
    const markup = normalize(
      renderToStaticMarkup(
        createElement(SubscriptionPlanGrid, {
          plans: [
            pricedPlan(0, [
              { billingInterval: "Monthly", price: 500000 },
              { billingInterval: "Yearly", price: 5000000 },
            ]),
            pricedPlan(1, [{ billingInterval: "Yearly", price: 9000000 }]),
          ],
        }),
      ),
    );
    expect(markup).toMatch(
      /<input[^>]*name="plan-billing-interval"[^>]*checked=""[^>]*value="Monthly"/,
    );
    expect(markup).toContain(">Yearly</label>");
    expect(markup).toContain("NGN 5,000.00");
    expect(markup).toContain(
      'href="/billing/checkout?billingInterval=Monthly&amp;planId=00000000-0000-4000-8000-000000000100"',
    );
    // A plan without the selected interval shows its own offered price.
    expect(markup).toContain("NGN 90,000.00");
    expect(markup).toContain(
      'href="/billing/checkout?billingInterval=Yearly&amp;planId=00000000-0000-4000-8000-000000000101"',
    );
  });

  it("omits the toggle when only one interval is offered", () => {
    const markup = renderToStaticMarkup(
      createElement(SubscriptionPlanGrid, {
        plans: [pricedPlan(0, [{ billingInterval: "Monthly", price: 500000 }])],
      }),
    );
    expect(markup).not.toContain("plan-billing-interval");
  });
});

describe("BillingHistoryCard", () => {
  it("renders all seven columns and does not label failures as paid", () => {
    hooks.useBillingHistory.mockReturnValue(
      historyPage([
        historyItem(),
        historyItem({
          paidAtUtc: null,
          paymentStatus: "Failed",
          paymentTransactionId: "tx-2",
        }),
        historyItem({
          paidAtUtc: null,
          paymentStatus: "Initiated",
          paymentTransactionId: "tx-3",
        }),
      ]),
    );
    const markup = renderHistory();
    expect(hooks.useBillingHistory).toHaveBeenCalledWith("Stakeholder", {
      page: 1,
      pageSize: 20,
    });
    for (const column of SEVEN_COLUMNS) expect(markup).toContain(`>${column}<`);
    expect(markup).toMatch(/data-tone="success"[^>]*>Succeeded</);
    expect(markup).toMatch(/data-tone="danger"[^>]*>Failed</);
    expect(markup).toMatch(/data-tone="warning"[^>]*>Pending</);
    expect(markup).toContain("Not paid");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toContain("Bachs");
    expect(markup).toContain("Nov 23, 2026 – Dec 23, 2026");
    expect(markup).toMatch(/class="text-right[^"]*"[^>]*>Amount</);
    expect(markup).not.toContain("Invoice");
    expect(markup).not.toContain('aria-label="Pagination"');
  });

  it("shows a placeholder for a missing billing period", () => {
    hooks.useBillingHistory.mockReturnValue(
      historyPage([historyItem({ billingPeriodEndUtc: null })]),
    );
    expect(renderHistory()).toMatch(/>—</);
  });

  it("abbreviates long references and copies the full value", () => {
    const reference = "pay_019a2b3c4d5e6f708f3d";
    hooks.useBillingHistory.mockReturnValue(
      historyPage([historyItem({ merchantReference: reference })]),
    );
    const markup = renderHistory();
    expect(markup).toContain(`aria-label="Copy reference ${reference}"`);
    expect(markup).toContain(`title="${reference}"`);
    expect(markup).toContain(">pay_019…708f3d<");
  });

  it("contains horizontal overflow inside the table", () => {
    hooks.useBillingHistory.mockReturnValue(historyPage([historyItem()]));
    const markup = renderHistory();
    expect(markup).toContain('class="overflow-x-auto"');
    expect(markup).toContain("whitespace-nowrap");
  });

  it("paginates from server totals on the current route", () => {
    hooks.useBillingHistory.mockReturnValue(
      historyPage([historyItem()], { page: 2, totalCount: 45 }),
    );
    const markup = renderHistory(2);
    expect(hooks.useBillingHistory).toHaveBeenCalledWith("Stakeholder", {
      page: 2,
      pageSize: 20,
    });
    expect(markup).toContain('aria-label="Pagination"');
    expect(markup).toContain('href="/billing?page=3"');
    expect(markup).toMatch(/aria-current="page"[^>]*>2</);
    expect(billingHistoryPageHref(1)).toBe("/billing");

    const historyRoute = renderHistory(2, "/billing/history");
    expect(historyRoute).toContain('href="/billing/history?page=3"');
    expect(billingHistoryPageHref(1, "/billing/history")).toBe(
      "/billing/history",
    );
  });

  it("shows empty, loading, and error states", () => {
    hooks.useBillingHistory.mockReturnValue(historyPage([]));
    expect(renderHistory()).toContain("No billing activity yet.");

    hooks.useBillingHistory.mockReturnValue({ isPending: true });
    expect(renderHistory()).toContain("Loading billing history");

    hooks.useBillingHistory.mockReturnValue({
      error: new ApiError({ kind: "server", safeMessage: "x", status: 500 }),
      isError: true,
      isPending: false,
    });
    expect(renderHistory()).toContain(
      "Billing history could not be loaded. Refresh and try again.",
    );
  });
});

describe("copyText", () => {
  it("writes the complete value and reports failures without throwing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyText("pay_full_reference", { writeText })).resolves.toBe(
      true,
    );
    expect(writeText).toHaveBeenCalledWith("pay_full_reference");

    const rejecting = vi.fn().mockRejectedValue(new Error("denied"));
    await expect(copyText("x", { writeText: rejecting })).resolves.toBe(false);
    await expect(copyText("x", undefined)).resolves.toBe(false);
  });
});
