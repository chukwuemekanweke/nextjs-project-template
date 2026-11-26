import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queries = vi.hoisted(() => ({
  history: vi.fn(),
  passkeys: vi.fn(),
  sessions: vi.fn(),
  subscription: vi.fn(),
  twoFactor: vi.fn(),
}));

vi.mock("@template/api-react/authentication", () => ({
  useActiveSessions: () => queries.sessions(),
  usePasskeys: () => queries.passkeys(),
  useTwoFactorStatus: () => queries.twoFactor(),
}));
vi.mock("@template/api-react/subscriptions", () => ({
  DEFAULT_BILLING_HISTORY_PAGE_SIZE: 20,
  useBillingHistory: (...args: unknown[]) => queries.history(...args),
  useCurrentSubscription: (...args: unknown[]) => queries.subscription(...args),
}));

import {
  DashboardMetrics,
  RecentBillingActivityCard,
  SecurityChecklistCard,
} from "./dashboard-live";

const ready = <T,>(data: T) => ({
  data,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
});
const loading = {
  isError: false,
  isFetching: true,
  isPending: true,
  refetch: vi.fn(),
};
const failed = {
  error: new Error("boom"),
  isError: true,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
};

const render = (component: () => unknown) =>
  renderToStaticMarkup(createElement(component as () => null));

beforeEach(() => {
  queries.subscription.mockReturnValue(
    ready({
      autoRenew: true,
      cancelAtPeriodEnd: false,
      currentPeriodEndUtc: "2026-12-14T00:00:00Z",
      lifecycleStatus: "Active",
      nextBillingAtUtc: "2026-12-14T12:00:00Z",
      planName: "Pro",
      status: "Active",
    }),
  );
  queries.twoFactor.mockReturnValue(
    ready({ enabled: true, recoveryCodesRemaining: 6 }),
  );
  queries.passkeys.mockReturnValue(ready([{ id: "a" }]));
  queries.sessions.mockReturnValue(
    ready([
      { isCurrent: true, sessionId: "a" },
      { isCurrent: false, sessionId: "b" },
      { isCurrent: false, sessionId: "c" },
    ]),
  );
  queries.history.mockReturnValue(
    ready({ items: [], page: 1, pageSize: 20, totalCount: 0 }),
  );
});

describe("DashboardMetrics", () => {
  it("renders every tile from live queries for the personal billing account", () => {
    const markup = render(DashboardMetrics);

    expect(queries.subscription).toHaveBeenCalledWith("Stakeholder");
    expect(markup).toContain(">Pro<");
    expect(markup).toContain("Renews Dec 14, 2026");
    expect(markup).toContain(">2 of 3<");
    expect(markup).toContain("Add a backup passkey");
    expect(markup).toContain(">3<");
    expect(markup).toContain("This device + 2 others");
  });

  it("always shows the wallet as not available, never a balance", () => {
    const markup = render(DashboardMetrics);
    expect(markup).toContain("Wallet balance");
    expect(markup).toContain(">Not available<");
    expect(markup).toContain("Wallet is not available yet.");
    expect(markup).not.toMatch(/₦|42,500/);
  });

  it("shows loading placeholders while queries are pending", () => {
    queries.subscription.mockReturnValue(loading);
    queries.passkeys.mockReturnValue(loading);
    queries.sessions.mockReturnValue(loading);
    const markup = render(DashboardMetrics);

    expect(markup).toContain("Loading current plan");
    expect(markup).toContain("Loading security score");
    expect(markup).toContain("Loading active sessions");
    expect(markup).not.toContain("Try again");
  });

  it("shows unavailable tiles with a retry instead of fallback values", () => {
    queries.subscription.mockReturnValue(failed);
    queries.twoFactor.mockReturnValue(failed);
    queries.sessions.mockReturnValue(failed);
    const markup = render(DashboardMetrics);

    expect(markup).toContain("Plan details could not be loaded.");
    expect(markup).toContain("Security status could not be loaded.");
    expect(markup).toContain("Sessions could not be loaded.");
    expect(markup).toContain('aria-label="Try loading your plan again"');
    expect(markup).toContain('aria-label="Try loading active sessions again"');
    expect(markup).not.toMatch(/of 3</);
  });

  it("offers plan discovery when the backend reports no subscription", () => {
    queries.subscription.mockReturnValue(ready(null));
    const markup = render(DashboardMetrics);
    expect(markup).toContain(">No plan<");
    expect(markup).toContain("Choose a plan in Billing.");
  });
});

describe("SecurityChecklistCard", () => {
  it("links to Security and offers actions only for missing protections", () => {
    const markup = render(SecurityChecklistCard);

    expect(markup).toMatch(/<a[^>]*href="\/security"[^>]*>Open security<\/a>/);
    expect(markup).toContain("Authenticator app · 6 recovery codes left");
    expect(markup).toContain("1 passkey registered");
    expect(markup).toContain('aria-label="Set up backup passkey in Security"');
    expect(markup).not.toContain(
      "Set up two-factor authentication in Security",
    );
    expect(markup).not.toContain("Password");
  });

  it("does not claim protections that could not be loaded", () => {
    queries.twoFactor.mockReturnValue(failed);
    queries.passkeys.mockReturnValue(failed);
    const markup = render(SecurityChecklistCard);

    expect(markup).not.toContain("Done:");
    expect(markup.match(/Unavailable: /g)).toHaveLength(3);
    expect(markup).not.toContain('in Security"');
  });
});

describe("RecentBillingActivityCard", () => {
  it("reuses the first Billing history page", () => {
    render(RecentBillingActivityCard);
    expect(queries.history).toHaveBeenCalledWith("Stakeholder", {
      page: 1,
      pageSize: 20,
    });
  });

  it("lists backend billing rows and links to the full history", () => {
    queries.history.mockReturnValue(
      ready({
        items: [
          {
            amount: 1500000,
            createdAtUtc: "2026-11-10T00:00:00Z",
            currencyCode: "NGN",
            paidAtUtc: "2026-11-14T00:00:00Z",
            paymentProviderName: "Bachs",
            paymentStatus: "Succeeded",
            paymentTransactionId: "t1",
            planName: "Standard",
          },
        ],
        page: 1,
        pageSize: 20,
        totalCount: 1,
      }),
    );
    const markup = render(RecentBillingActivityCard);

    expect(markup).toContain("Standard · Bachs");
    expect(markup).toContain("Succeeded");
    expect(markup).toMatch(/href="\/billing\/history"[^>]*>See all</);
    expect(markup).not.toContain("Wallet top-up");
  });

  it("shows an empty state when there is no billing activity", () => {
    const markup = render(RecentBillingActivityCard);
    expect(markup).toContain("No billing activity yet");
  });

  it("shows an error with retry when history cannot be loaded", () => {
    queries.history.mockReturnValue(failed);
    const markup = render(RecentBillingActivityCard);
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Your billing activity could not be loaded.");
    expect(markup).toContain("Try again");
  });

  it("announces loading", () => {
    queries.history.mockReturnValue(loading);
    expect(render(RecentBillingActivityCard)).toContain(
      "Loading recent activity",
    );
  });
});
