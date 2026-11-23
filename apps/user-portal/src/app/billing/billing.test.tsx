import { ApiError } from "@template/api-client";
import type {
  BillingHistoryItemResponse,
  GetCurrentSubscriptionQueryResponse,
} from "@template/api-client/subscriptions";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useBillingHistory: vi.fn(),
  useCancelSubscriptionAtPeriodEnd: vi.fn(),
  useCurrentSubscription: vi.fn(),
}));

vi.mock("@template/api-react/subscriptions", () => ({
  DEFAULT_BILLING_HISTORY_PAGE_SIZE: 20,
  useBillingHistory: (...args: unknown[]) => hooks.useBillingHistory(...args),
  useCancelSubscriptionAtPeriodEnd: () =>
    hooks.useCancelSubscriptionAtPeriodEnd(),
  useCurrentSubscription: (...args: unknown[]) =>
    hooks.useCurrentSubscription(...args),
}));

import {
  BillingHistoryCard,
  billingHistoryPageHref,
} from "./billing-history-card";
import { CurrentSubscriptionCard } from "./current-subscription-card";

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

const normalize = (markup: string) => markup.replace(/ /g, " ");
const renderCurrent = () =>
  normalize(renderToStaticMarkup(createElement(CurrentSubscriptionCard)));
const renderHistory = (page = 1) =>
  normalize(renderToStaticMarkup(createElement(BillingHistoryCard, { page })));

beforeEach(() => {
  hooks.useCancelSubscriptionAtPeriodEnd.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
});

describe("CurrentSubscriptionCard", () => {
  it("treats no subscription as an empty state with a path to plans", () => {
    hooks.useCurrentSubscription.mockReturnValue({
      data: null,
      isPending: false,
    });
    const markup = renderCurrent();
    expect(hooks.useCurrentSubscription).toHaveBeenCalledWith("Stakeholder");
    expect(markup).toContain("No active subscription");
    expect(markup).toContain('href="/billing/checkout"');
  });

  it("shows an active subscription with distinct period and billing dates", () => {
    hooks.useCurrentSubscription.mockReturnValue({
      data: subscription(),
      isPending: false,
    });
    const markup = renderCurrent();
    expect(markup).toContain("Pro Monthly");
    expect(markup).toContain("NGN 7,500.00 / month");
    expect(markup).toContain(">Active<");
    expect(markup).toContain("Current period ends");
    expect(markup).toContain("Dec 23, 2026");
    expect(markup).toContain("Next billing date");
    expect(markup).toContain("Dec 22, 2026");
    expect(markup).toContain('data-subscription-status="Active"');
  });

  it("requires confirmation before cancelling", () => {
    hooks.useCurrentSubscription.mockReturnValue({
      data: subscription(),
      isPending: false,
    });
    const markup = renderCurrent();
    expect(markup).toContain("Cancel at period end");
    expect(markup).not.toContain('role="dialog"');
  });

  it("presents past-due subscriptions", () => {
    hooks.useCurrentSubscription.mockReturnValue({
      data: subscription({ lifecycleStatus: "PastDue" }),
      isPending: false,
    });
    const markup = renderCurrent();
    expect(markup).toContain("Past due");
    expect(markup).toContain("renewal payment has not been settled");
  });

  it("shows the scheduled cancellation date without offering cancellation again", () => {
    hooks.useCurrentSubscription.mockReturnValue({
      data: subscription({
        autoRenew: false,
        cancelAtPeriodEnd: true,
        cancellationEffectiveAtUtc: "2026-12-23T12:05:00Z",
        cancellationRequestedAtUtc: "2026-11-30T09:00:00Z",
      }),
      isPending: false,
    });
    const markup = renderCurrent();
    expect(markup).toContain("Cancellation scheduled");
    expect(markup).toContain("Cancellation effective");
    expect(markup).toContain("Dec 23, 2026");
    expect(markup).not.toContain("Next billing date");
    expect(markup).not.toContain("Cancel at period end");
  });

  it.each(["Pending", "Cancelled", "Expired"])(
    "does not offer cancellation for %s subscriptions",
    (lifecycleStatus) => {
      hooks.useCurrentSubscription.mockReturnValue({
        data: subscription({ lifecycleStatus, status: lifecycleStatus }),
        isPending: false,
      });
      const markup = renderCurrent();
      expect(markup).toContain(lifecycleStatus);
      expect(markup).not.toContain("Cancel at period end");
    },
  );

  it("shows loading and error states", () => {
    hooks.useCurrentSubscription.mockReturnValue({ isPending: true });
    expect(renderCurrent()).toContain("Loading subscription");
    hooks.useCurrentSubscription.mockReturnValue({
      error: new ApiError({ kind: "server", safeMessage: "x", status: 500 }),
      isError: true,
      isPending: false,
    });
    expect(renderCurrent()).toContain(
      "Your subscription could not be loaded. Refresh and try again.",
    );
  });
});

describe("BillingHistoryCard", () => {
  it("renders purchases and renewal attempts without labelling failures as paid", () => {
    hooks.useBillingHistory.mockReturnValue({
      data: {
        items: [
          historyItem(),
          historyItem({
            paidAtUtc: null,
            paymentStatus: "Failed",
            paymentTransactionId: "tx-2",
          }),
        ],
        page: 1,
        pageSize: 20,
        totalCount: 2,
      },
      isPending: false,
    });
    const markup = renderHistory();
    expect(hooks.useBillingHistory).toHaveBeenCalledWith("Stakeholder", {
      page: 1,
      pageSize: 20,
    });
    expect(markup).toContain(">Paid<");
    expect(markup).toContain(">Failed<");
    expect(markup).toContain("Not paid");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toContain("Bachs");
    expect(markup).toContain("pay_1");
    expect(markup).toContain("Nov 23, 2026 – Dec 23, 2026");
    expect(markup).not.toContain("Invoice");
    expect(markup).not.toContain('aria-label="Pagination"');
  });

  it("paginates from server totals", () => {
    hooks.useBillingHistory.mockReturnValue({
      data: { items: [historyItem()], page: 2, pageSize: 20, totalCount: 45 },
      isPending: false,
    });
    const markup = renderHistory(2);
    expect(markup).toContain('aria-label="Pagination"');
    expect(markup).toContain('href="/billing?page=3"');
    expect(markup).toMatch(/aria-current="page"[^>]*>2</);
    expect(billingHistoryPageHref(1)).toBe("/billing");
  });

  it("shows empty, loading, and error states", () => {
    hooks.useBillingHistory.mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, totalCount: 0 },
      isPending: false,
    });
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
