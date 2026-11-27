import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RegistrationAnalyticsFilters } from "./registration-analytics-model";
import { registrationAnalyticsPreview } from "./registration-analytics-preview.fixtures";
import { RegistrationAnalyticsScreen } from "./registration-analytics-screen";

const filters: RegistrationAnalyticsFilters = {
  customRange: { end: "2026-11-25", start: "2026-10-27" },
  granularity: "day",
  query: "",
  range: "30d",
  selectedPeriod: null,
};

describe("RegistrationAnalyticsScreen", () => {
  it("renders typed metrics, the trend and honest user values", () => {
    const markup = renderToStaticMarkup(
      <RegistrationAnalyticsScreen
        filters={filters}
        model={registrationAnalyticsPreview}
      />,
    );
    expect(markup).toContain("Registrations");
    expect(markup).toContain("12,480");
    expect(markup).toContain("Amara Fixture");
    expect(markup).toContain("Never");
    expect(markup).toContain("Not reported");
    expect(markup).toContain("Users registered in the reporting period");
  });

  it("presents the selected chart period as the table's reporting context", () => {
    const markup = renderToStaticMarkup(
      <RegistrationAnalyticsScreen
        filters={{
          ...filters,
          selectedPeriod: { end: "2026-11-24", start: "2026-11-24" },
        }}
        model={registrationAnalyticsPreview}
        onFiltersChange={() => undefined}
      />,
    );
    expect(markup).toMatch(/aria-pressed="true"[^>]*>(?:<[^>]*>)*24 Nov/);
    expect(markup).toContain("Users registered 24 Nov – 24 Nov 2026 (UTC)");
  });

  it("disables filters, search and period selection with a reason", () => {
    const markup = renderToStaticMarkup(
      <RegistrationAnalyticsScreen
        filters={filters}
        model={registrationAnalyticsPreview}
      />,
    );
    expect(markup).toContain(
      "Registration filters become available with the admin analytics API.",
    );
    expect(markup).toMatch(/<input[^>]*disabled=""/);
    expect(markup).toMatch(/aria-pressed="false"[^>]*disabled=""/);
  });

  it("preserves the backend permission when the user read is forbidden", () => {
    const markup = renderToStaticMarkup(
      <RegistrationAnalyticsScreen
        filters={filters}
        model={{
          ...registrationAnalyticsPreview,
          users: {
            permission: "analytics.registrations.read",
            requestDetails: { requestId: "req-7" },
            state: "forbidden",
          },
        }}
      />,
    );
    expect(markup).toContain("Error 403");
    expect(markup).toContain("analytics.registrations.read");
    expect(markup).toContain("Copy request details");
  });
});
