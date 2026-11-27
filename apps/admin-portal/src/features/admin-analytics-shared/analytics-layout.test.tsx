import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AnalyticsReportingPeriodFields,
  AnalyticsScreenLayout,
  AnalyticsScreenStateBoundary,
  AnalyticsSelect,
} from "./analytics-layout";
import { ReportedCurrencyNotice } from "./reported-currency-notice";

const options = [
  { label: "Naira", value: "NGN" },
  { label: "Cedi", value: "GHS" },
];

const chart = (id: string) => ({
  data: { state: "loading" as const },
  id,
  kind: "line" as const,
  title: id,
});

function describedHint(markup: string): string | undefined {
  const id = /aria-describedby="([^"]+)"/.exec(markup)?.[1];
  if (!id) {
    return undefined;
  }
  return new RegExp(`id="${id}"[^>]*>([^<]+)<`).exec(markup)?.[1];
}

describe("AnalyticsSelect", () => {
  it("shows only a supplied option as selected", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsSelect
        label="Currency"
        onChange={() => undefined}
        options={options}
        value="USD"
      />,
    );
    expect(markup).not.toMatch(/value="USD"/);
    expect(markup).toMatch(/<option disabled="" value="" selected="">Select…/);
    expect(markup).not.toMatch(/<select[^>]*disabled=""/);
  });

  it("adds an all choice with the empty value", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsSelect
        allLabel="All providers"
        label="Provider"
        onChange={() => undefined}
        options={options}
        value=""
      />,
    );
    expect(markup).toMatch(/<option value="" selected="">All providers/);
  });

  it("links the reason when there is no handler, source or option", () => {
    expect(
      describedHint(
        renderToStaticMarkup(
          <AnalyticsSelect label="Plan" options={options} value="NGN" />,
        ),
      ),
    ).toContain("Filtering is not available yet");
    expect(
      describedHint(
        renderToStaticMarkup(
          <AnalyticsSelect
            disabledReason="Loading plans…"
            label="Plan"
            onChange={() => undefined}
            options={[]}
            value=""
          />,
        ),
      ),
    ).toBe("Loading plans…");
    expect(
      describedHint(
        renderToStaticMarkup(
          <AnalyticsSelect
            label="Plan"
            onChange={() => undefined}
            options={[]}
            value=""
          />,
        ),
      ),
    ).toBe("No options to choose from.");
  });
});

describe("AnalyticsReportingPeriodFields", () => {
  const customRange = { end: "2026-11-25", start: "2026-11-01" };

  it("shows UTC date fields only for a custom range", () => {
    const preset = renderToStaticMarkup(
      <AnalyticsReportingPeriodFields
        onChange={() => undefined}
        value={{ customRange, range: "30d" }}
      />,
    );
    expect(preset).not.toContain("Start date");

    const custom = renderToStaticMarkup(
      <AnalyticsReportingPeriodFields
        onChange={() => undefined}
        value={{ customRange, range: "custom" }}
      />,
    );
    expect(custom).toContain("Start date");
    expect(custom).toContain('value="2026-11-01"');
    expect(custom).toContain("UTC calendar date");
  });
});

describe("AnalyticsScreenLayout", () => {
  it("lets a single chart use the full width", () => {
    const single = renderToStaticMarkup(
      <AnalyticsScreenLayout
        charts={[chart("one")]}
        description="d"
        metrics={[]}
        title="t"
      />,
    );
    expect(single).not.toContain("xl:grid-cols-2");
    const pair = renderToStaticMarkup(
      <AnalyticsScreenLayout
        charts={[chart("one"), chart("two")]}
        description="d"
        metrics={[]}
        title="t"
      />,
    );
    expect(pair).toContain("xl:grid-cols-2");
  });
});

describe("AnalyticsScreenStateBoundary", () => {
  it("preserves the backend permission and safe request details", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsScreenStateBoundary
        description="d"
        label="Payment analytics"
        state={{
          permission: "analytics.payments.read",
          requestDetails: { path: "/admin/analytics?x=1", requestId: "req-42" },
          state: "forbidden",
        }}
        title="Payment analytics"
      >
        {() => null}
      </AnalyticsScreenStateBoundary>,
    );
    expect(markup).toContain("Error 403");
    expect(markup).toContain("analytics.payments.read");
    expect(markup).toContain("Copy request details");
  });

  it("renders the header with a retryable error", () => {
    const markup = renderToStaticMarkup(
      <AnalyticsScreenStateBoundary
        description="d"
        label="Payment analytics"
        onRetry={() => undefined}
        state={{ message: "Aggregate read failed.", state: "error" }}
        title="Payment analytics"
      >
        {() => null}
      </AnalyticsScreenStateBoundary>,
    );
    expect(markup).toContain("Payment analytics");
    expect(markup).toContain("Aggregate read failed.");
    expect(markup).toContain("Try again");
  });
});

describe("ReportedCurrencyNotice", () => {
  it("labels figures with the reported currency, not a pending selection", () => {
    expect(
      renderToStaticMarkup(
        <ReportedCurrencyNotice
          reportedCurrencyCode="NGN"
          requestedCurrencyCode="NGN"
        />,
      ),
    ).toContain("Amounts are reported in NGN.");
    expect(
      renderToStaticMarkup(
        <ReportedCurrencyNotice
          reportedCurrencyCode="NGN"
          requestedCurrencyCode="ghs"
        />,
      ),
    ).toContain(
      "Showing figures reported in NGN. GHS figures have not loaded yet.",
    );
  });
});
