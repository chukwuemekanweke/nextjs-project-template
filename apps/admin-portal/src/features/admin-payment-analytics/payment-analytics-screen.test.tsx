import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PaymentAnalyticsFilters } from "./payment-analytics-model";
import { paymentAnalyticsPreview } from "./payment-analytics-preview.fixtures";
import { PaymentAnalyticsScreen } from "./payment-analytics-screen";

const filters: PaymentAnalyticsFilters = {
  currency: "NGN",
  interval: "day",
  provider: "",
  range: "30d",
};

describe("PaymentAnalyticsScreen", () => {
  it("renders currency-scoped figures and breakdowns", () => {
    const markup = renderToStaticMarkup(
      <PaymentAnalyticsScreen
        filters={filters}
        state={{ data: paymentAnalyticsPreview, state: "ready" }}
      />,
    );
    expect(markup).toContain("Payment analytics");
    expect(markup).toContain("FixturePay");
    expect(markup).toContain("Amounts are reported in NGN.");
    expect(markup).not.toContain("All currencies");
  });

  it("keeps stale figures labelled with the reported currency", () => {
    const markup = renderToStaticMarkup(
      <PaymentAnalyticsScreen
        currencyOptions={{
          options: [
            { label: "NGN", value: "NGN" },
            { label: "GHS", value: "GHS" },
          ],
          state: "ready",
        }}
        filters={{ ...filters, currency: "GHS" }}
        onFiltersChange={() => undefined}
        state={{ data: paymentAnalyticsPreview, state: "ready" }}
      />,
    );
    expect(markup).toContain(
      "Showing figures reported in NGN. GHS figures have not loaded yet.",
    );
    expect(markup).toContain("Amounts in NGN");
    expect(markup).toContain("NGN");
    expect(markup).not.toMatch(/GH₵|GHS\s?\d/);
  });

  it("explains option reads that are not ready", () => {
    const markup = renderToStaticMarkup(
      <PaymentAnalyticsScreen
        currencyOptions={{ state: "loading" }}
        filters={filters}
        onFiltersChange={() => undefined}
        providerOptions={{ reason: "No provider read.", state: "unavailable" }}
        state={{ data: paymentAnalyticsPreview, state: "ready" }}
      />,
    );
    expect(markup).toContain("Loading currencies…");
    expect(markup).toContain("No provider read.");
  });

  it("keeps a missing breakdown distinct from an empty one", () => {
    const markup = renderToStaticMarkup(
      <PaymentAnalyticsScreen
        filters={filters}
        state={{
          data: { ...paymentAnalyticsPreview, intents: [], providers: null },
          state: "ready",
        }}
      />,
    );
    expect(markup).toContain(
      "This breakdown is not reported by an admin analytics API yet.",
    );
    expect(markup).toContain("No breakdown data");
  });

  it("renders a screen-level forbidden state with the backend permission", () => {
    const markup = renderToStaticMarkup(
      <PaymentAnalyticsScreen
        filters={filters}
        state={{ permission: "analytics.payments.read", state: "forbidden" }}
      />,
    );
    expect(markup).toContain("Error 403");
    expect(markup).toContain("analytics.payments.read");
  });
});
