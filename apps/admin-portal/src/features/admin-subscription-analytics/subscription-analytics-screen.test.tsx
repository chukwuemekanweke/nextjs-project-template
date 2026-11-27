import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SubscriptionAnalyticsFilters } from "./subscription-analytics-model";
import { subscriptionAnalyticsPreview } from "./subscription-analytics-preview.fixtures";
import { SubscriptionAnalyticsScreen } from "./subscription-analytics-screen";

const filters: SubscriptionAnalyticsFilters = {
  currency: "NGN",
  owner: "",
  plan: "",
  range: "30d",
};

describe("SubscriptionAnalyticsScreen", () => {
  it("renders revenue, lifecycle and renewal aggregates", () => {
    const markup = renderToStaticMarkup(
      <SubscriptionAnalyticsScreen
        filters={filters}
        state={{ data: subscriptionAnalyticsPreview, state: "ready" }}
      />,
    );
    expect(markup).toContain("Subscription analytics");
    expect(markup).toContain("Monthly recurring revenue");
    expect(markup).toContain("Renewals");
    expect(markup).toContain("Amounts are reported in NGN.");
  });

  it("offers source plan and owner options with an all choice", () => {
    const markup = renderToStaticMarkup(
      <SubscriptionAnalyticsScreen
        currencyOptions={{
          options: [{ label: "NGN", value: "NGN" }],
          state: "ready",
        }}
        filters={{ ...filters, plan: "plan-pro" }}
        onFiltersChange={() => undefined}
        ownerOptions={{ message: "Owner read failed.", state: "error" }}
        planOptions={{
          options: [{ label: "Pro", value: "plan-pro" }],
          state: "ready",
        }}
        state={{ data: subscriptionAnalyticsPreview, state: "ready" }}
      />,
    );
    expect(markup).toContain("All plans");
    expect(markup).toMatch(/<option value="plan-pro" selected="">Pro/);
    expect(markup).toContain("Owner read failed.");
  });

  it("renders loading and forbidden screen states", () => {
    expect(
      renderToStaticMarkup(
        <SubscriptionAnalyticsScreen
          filters={filters}
          state={{ state: "loading" }}
        />,
      ),
    ).toContain("Loading subscription analytics");
    const forbidden = renderToStaticMarkup(
      <SubscriptionAnalyticsScreen
        filters={filters}
        state={{
          requestDetails: {
            path: "/analytics/subscriptions",
            requestId: "r-1",
          },
          state: "forbidden",
        }}
      />,
    );
    expect(forbidden).toContain("Error 403");
    expect(forbidden).toContain("Copy request details");
  });
});
