import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FIXTURE_NOW,
  fulfilledPurchaseFixture,
  historyFixtures,
  providerFixtures,
  subscriptionFixtures,
} from "./__fixtures__/billing-states.fixtures";

const hooks = vi.hoisted(() => ({
  useBillingHistory: vi.fn(),
  useCancelSubscriptionAtPeriodEnd: vi.fn(),
}));

// Purchase hooks are deliberately absent: none of these views may purchase.
vi.mock("@template/api-react/subscriptions", () => ({
  DEFAULT_BILLING_HISTORY_PAGE_SIZE: 20,
  useBillingHistory: (...args: unknown[]) => hooks.useBillingHistory(...args),
  useCancelSubscriptionAtPeriodEnd: () =>
    hooks.useCancelSubscriptionAtPeriodEnd(),
}));

import { BillingHistoryCard } from "./billing-history-card";
import { NoActiveSubscription } from "./billing-overview";
import { PaymentMethodCard } from "./checkout/payment-method-selector";
import {
  PaymentResultCard,
  PaymentResultSummary,
} from "./checkout/payment-result";
import {
  CurrentSubscriptionCard,
  PendingSubscriptionCard,
} from "./current-subscription-card";
import { PurchaseStatusDetails } from "./purchases/[purchaseId]/purchase-status-view";

const normalize = (markup: string) => markup.replace(/ /g, " ");
const render = (element: ReturnType<typeof createElement>) =>
  normalize(renderToStaticMarkup(element));

/** Actions in the reference that the customer API cannot perform (DR-055). */
const UNSUPPORTED_ACTIONS = [
  ">Pay now<",
  ">Resume payment<",
  ">Upgrade",
  "Most popular",
  "saved at",
];

function renderCard(
  subscription: (typeof subscriptionFixtures)[keyof typeof subscriptionFixtures],
) {
  return render(
    createElement(CurrentSubscriptionCard, {
      now: FIXTURE_NOW,
      ownerType: "Stakeholder",
      subscription,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useCancelSubscriptionAtPeriodEnd.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
});

describe("billing lifecycle states (reference UserBilling-*)", () => {
  it("active: badge, interval, renewal date, period bar and cancellation", () => {
    const markup = renderCard(subscriptionFixtures.active);
    expect(markup).toMatch(/data-tone="success"[^>]*>Active</);
    expect(markup).toContain(">Monthly<");
    expect(markup).toContain(
      "NGN 15,000.00 per month · renews automatically on Dec 14, 2026.",
    );
    expect(markup).toContain("Nov 14, 2026 – Dec 14, 2026");
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="50"');
    expect(markup).toContain(">Cancel at period end<");
    for (const action of UNSUPPORTED_ACTIONS)
      expect(markup).not.toContain(action);
  });

  it("cancelling: stays active until the backend end date, with no resume", () => {
    const markup = renderCard(subscriptionFixtures.cancelling);
    expect(markup).toMatch(/data-tone="warning"[^>]*>Cancellation scheduled</);
    expect(markup).toContain(
      "Auto-renew is off. You keep access until Dec 14, 2026",
    );
    expect(markup).toContain("Cancellation requested");
    expect(markup).not.toContain(">Cancel at period end<");
    expect(markup).not.toContain(">Keep subscription<");
    expect(markup).not.toContain("renews automatically on");
  });

  it("past due: danger badge and alert without a pay-now action", () => {
    const markup = renderCard(subscriptionFixtures.pastDue);
    expect(markup).toMatch(/data-tone="danger"[^>]*>Past due</);
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Renewal payment not settled.");
    for (const action of UNSUPPORTED_ACTIONS)
      expect(markup).not.toContain(action);
  });

  it("unknown lifecycle: shown neutrally as an entitlement, never as purchasable", () => {
    const markup = renderCard(subscriptionFixtures.unknown);
    expect(markup).toMatch(/data-tone="neutral"[^>]*>Paused</);
    expect(markup).not.toContain("Choose plan");
    expect(markup).not.toContain("/billing/checkout");
    expect(markup).not.toContain(">Cancel at period end<");
  });

  it("omits the period bar when the backend sends no period", () => {
    const markup = renderCard({
      ...subscriptionFixtures.active,
      currentPeriodStartUtc: null,
    });
    expect(markup).not.toContain("Current period<");
    expect(markup).not.toContain('role="progressbar"');
  });

  it("pending: recovery actions without a second checkout", () => {
    const markup = render(
      createElement(PendingSubscriptionCard, {
        attempt: null,
        onRefresh: vi.fn(),
        refreshing: false,
        subscription: subscriptionFixtures.pending,
      }),
    );
    expect(markup).toContain(">Pending<");
    expect(markup).toContain("Check again");
    expect(markup).not.toContain("View payment status");
    expect(markup).not.toContain("/billing/checkout");
    expect(markup).not.toContain(">Resume payment<");
  });

  it("none and expired: banners from real data only", () => {
    const none = render(createElement(NoActiveSubscription, {}));
    expect(none).toContain("No active subscription");
    expect(none).not.toContain("expired");
    expect(none).not.toContain("data-ended-subscription=");

    const expired = render(
      createElement(NoActiveSubscription, {
        ended: subscriptionFixtures.expired,
      }),
    );
    expect(expired).toContain("Your Standard subscription has ended");
    expect(expired).toContain("It ended on Nov 14, 2026.");
    expect(expired).toMatch(/data-tone="neutral"[^>]*>Expired</);
  });
});

describe("billing history (reference UserBillingHistory)", () => {
  beforeEach(() =>
    hooks.useBillingHistory.mockReturnValue({
      data: {
        items: historyFixtures,
        page: 1,
        pageSize: 20,
        totalCount: historyFixtures.length,
      },
      isPending: false,
    }),
  );

  it("shows provider, status and amount with the server record count", () => {
    const markup = render(
      createElement(BillingHistoryCard, {
        basePath: "/billing/history",
        heading: false,
        page: 1,
      }),
    );
    expect(markup).toContain("2 records");
    expect(markup).toContain("Bachs");
    expect(markup).toContain("Credo");
    expect(markup).toMatch(/data-tone="success"[^>]*>Succeeded</);
    expect(markup).toMatch(/data-tone="danger"[^>]*>Failed</);
    expect(markup).toContain("NGN 15,000.00");
  });

  it("offers no filters, export, invoices or receipts the contract lacks", () => {
    const markup = render(
      createElement(BillingHistoryCard, {
        basePath: "/billing/history",
        heading: false,
        page: 1,
      }),
    );
    for (const absent of [
      "Export CSV",
      ">All<",
      ">Paid<",
      "Invoice",
      "Receipt",
      "/billing/purchases/",
    ])
      expect(markup).not.toContain(absent);
    // The history page itself is not linked from its own table.
    expect(markup).not.toContain(">View all<");
  });
});

describe("checkout providers", () => {
  const renderCardFor = (
    provider: (typeof providerFixtures)[keyof typeof providerFixtures],
    checked = false,
  ) =>
    render(
      createElement(PaymentMethodCard, {
        checked,
        onSelect: vi.fn(),
        provider,
      }),
    );

  it("describes capabilities from provider data only", () => {
    expect(renderCardFor(providerFixtures.hosted)).toContain(
      "Hosted checkout · supports auto-renew",
    );
    const bank = renderCardFor(providerFixtures.bankTransfer);
    expect(bank).toContain(">Bank transfer<");
    expect(bank).not.toContain("auto-renew");
    expect(bank).not.toContain("USSD");
  });

  it("disables a method the portal cannot complete", () => {
    const markup = renderCardFor(providerFixtures.card);
    expect(markup).toMatch(/<input[^>]*disabled=""/);
    expect(markup).toContain("Card is not available in this portal yet");
    expect(markup).toContain("cursor-not-allowed");
  });
});

describe("checkout result template (reference UserCheckoutResult-*)", () => {
  it.each([
    ["success", "success"],
    ["pending", "warning"],
    ["cancelled", "danger"],
    ["attention", "warning"],
  ] as const)("renders the %s outcome with a %s icon", (icon, tone) => {
    const markup = render(
      createElement(
        PaymentResultCard,
        { actions: null, description: "Backend outcome.", icon, title: "T" },
        createElement(PaymentResultSummary, {
          amount: "NGN 15,000.00",
          amountLabel: "Amount",
          planDetail: "Billed monthly",
          planName: "Standard",
          reference: "BCH_8812309912",
        }),
      ),
    );
    expect(markup).toContain(`data-result-icon="${icon}"`);
    expect(markup).toContain(`bg-${tone}-bg`);
    expect(markup).toContain("Standard");
    expect(markup).toContain("BCH_8812309912");
    expect(markup).not.toContain("View receipt");
  });
});

describe("purchase detail (reference UserPurchaseDetail)", () => {
  it("shows recorded events only, newest first, and no invoice actions", () => {
    const markup = render(
      createElement(PurchaseStatusDetails, {
        data: fulfilledPurchaseFixture,
        isFetching: false,
        onRefresh: vi.fn(),
        pollingExhausted: false,
        refreshFailed: false,
        retryHref: "/billing/checkout",
        supportEmail: "support@example.com",
      }),
    );
    expect(markup).toContain("Timeline");
    const activated = markup.indexOf("Subscription activated");
    const paid = markup.indexOf("Payment confirmed by Bachs");
    expect(activated).toBeGreaterThan(-1);
    expect(paid).toBeGreaterThan(activated);
    expect(markup).not.toContain("Purchase created");
    expect(markup).not.toContain("Redirected to");
    expect(markup).not.toContain("View invoice");
    expect(markup).not.toContain("View receipt");
  });

  it("omits the timeline when nothing has been recorded yet", () => {
    const markup = render(
      createElement(PurchaseStatusDetails, {
        data: {
          ...fulfilledPurchaseFixture,
          fulfilledAtUtc: null,
          isTerminal: false,
          paymentCompletedAtUtc: null,
          shouldContinuePolling: true,
          status: "PaymentPending",
        },
        isFetching: false,
        onRefresh: vi.fn(),
        pollingExhausted: false,
        refreshFailed: false,
        retryHref: "/billing/checkout",
        supportEmail: "support@example.com",
      }),
    );
    expect(markup).not.toContain("Timeline");
    expect(markup).toContain("Updating…");
  });
});

describe("billing fixtures", () => {
  it("are never imported by production modules", () => {
    const root = fileURLToPath(new URL(".", import.meta.url));
    const files: string[] = [];
    const walk = (directory: string) => {
      for (const entry of readdirSync(directory)) {
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) {
          if (entry !== "__fixtures__") walk(path);
        } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
          files.push(path);
        }
      }
    };
    walk(root);
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/__fixtures__/);
    }
  });
});
