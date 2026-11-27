import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ActiveUserAnalyticsFilters } from "./active-user-analytics-model";
import { activeUserAnalyticsPreview } from "./active-user-analytics-preview.fixtures";
import { ActiveUserAnalyticsScreen } from "./active-user-analytics-screen";

const filters: ActiveUserAnalyticsFilters = {
  customRange: { end: "2026-11-25", start: "2026-11-19" },
  range: "7d",
  selectedDate: null,
};

describe("ActiveUserAnalyticsScreen", () => {
  it("renders activity metrics and the active-user table", () => {
    const markup = renderToStaticMarkup(
      <ActiveUserAnalyticsScreen
        filters={filters}
        model={activeUserAnalyticsPreview}
      />,
    );
    expect(markup).toContain("DAU / MAU stickiness");
    expect(markup).toContain("Last activity");
    expect(markup).toContain("Last login");
    expect(markup).toContain("Active users in the reporting period");
  });

  it("titles the table with the selected UTC date", () => {
    const markup = renderToStaticMarkup(
      <ActiveUserAnalyticsScreen
        filters={{ ...filters, selectedDate: "2026-11-24" }}
        model={activeUserAnalyticsPreview}
        onFiltersChange={() => undefined}
      />,
    );
    expect(markup).toContain("Active on 24 Nov 2026 (UTC)");
    expect(markup).toMatch(/aria-pressed="true"[^>]*>(?:<[^>]*>)*24 Nov/);
  });

  it("shows custom UTC dates when the custom range is chosen", () => {
    const markup = renderToStaticMarkup(
      <ActiveUserAnalyticsScreen
        filters={{ ...filters, range: "custom" }}
        model={activeUserAnalyticsPreview}
        onFiltersChange={() => undefined}
      />,
    );
    expect(markup).toContain("Start date");
    expect(markup).toContain('value="2026-11-19"');
  });
});
