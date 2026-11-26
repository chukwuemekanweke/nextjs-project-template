import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaymentDetailScreen } from "./payment-detail";
import {
  DEFAULT_PAYMENT_FILTERS,
  describeFulfillment,
  describePaymentStatus,
  hasActivePaymentFilters,
  parsePaymentFilters,
  paymentFiltersToSearchParams,
} from "./payments-model";
import { PaymentsScreen } from "./payments-list";
import {
  fixturePaymentDetail,
  fixturePaymentList,
} from "./payments-preview.fixtures";

/*
 * Preview harness for ADM-PAYMENTS and ADM-PAYMENT-DETAIL (no route,
 * DR-070). Every state is rendered from typed fixtures.
 */

const render = (node: ReactNode) => renderToStaticMarkup(node);
const noop = () => undefined;
const providers = {
  options: [{ label: "Fixture Provider", value: "fixture" }],
  state: "ready",
} as const;

describe("payment filters", () => {
  it("parses URL params, dropping unknown statuses and intents", () => {
    const filters = parsePaymentFilters(
      new URLSearchParams(
        "q=%20FIX-PAY%20&status=Bogus&intent=WalletTopUp&currency=ngn&range=7d&provider=fixture",
      ),
    );
    expect(filters).toEqual({
      currency: "NGN",
      intent: "WalletTopUp",
      provider: "fixture",
      query: "FIX-PAY",
      range: "7d",
      status: "",
    });
  });

  it("falls back to defaults and caps search length", () => {
    const filters = parsePaymentFilters(
      new URLSearchParams(`range=1y&q=${"x".repeat(300)}`),
    );
    expect(filters.range).toBe("30d");
    expect(filters.query).toHaveLength(100);
  });

  it("serialises only non-default filters and round-trips", () => {
    expect(
      paymentFiltersToSearchParams(DEFAULT_PAYMENT_FILTERS).toString(),
    ).toBe("");
    expect(hasActivePaymentFilters(DEFAULT_PAYMENT_FILTERS)).toBe(false);
    const filters = {
      ...DEFAULT_PAYMENT_FILTERS,
      query: "ref",
      status: "Failed",
    };
    const params = paymentFiltersToSearchParams(filters);
    expect(params.toString()).toBe("q=ref&status=Failed");
    expect(parsePaymentFilters(params)).toEqual(filters);
    expect(hasActivePaymentFilters(filters)).toBe(true);
  });
});

describe("payment status and fulfillment", () => {
  it("maps documented statuses and never reads unknown as successful", () => {
    expect(describePaymentStatus("Succeeded")).toEqual({
      label: "Successful",
      tone: "success",
    });
    expect(describePaymentStatus("Initiated").label).toBe("Pending");
    expect(describePaymentStatus("ProviderReview")).toEqual({
      label: "ProviderReview",
      tone: "neutral",
    });
  });

  it("does not infer fulfillment from a successful payment", () => {
    const markup = render(
      <PaymentDetailScreen
        state={{
          record: fixturePaymentDetail({
            fulfillment: { status: "unknown" },
            paymentStatus: "Succeeded",
          }),
          state: "ready",
        }}
      />,
    );
    expect(markup).toContain(">Successful</span>");
    expect(markup).toContain('data-fulfillment="unknown"');
    expect(markup).toContain("Fulfillment not reported");
    expect(markup).not.toContain(">Fulfilled<");
  });

  it("states missing reasons instead of inventing them", () => {
    expect(describeFulfillment({ status: "blocked" }).description).toBe(
      "Fulfillment is blocked. No reason was recorded.",
    );
    expect(
      describeFulfillment({ status: "notFulfilled", reason: " " }).description,
    ).toBe("No access was granted. No reason was recorded.");
  });
});

describe("PaymentsScreen", () => {
  it("renders search, five filters and the eight reference columns", () => {
    const markup = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        onFiltersChange={noop}
        providerOptions={providers}
        state={fixturePaymentList()}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>Payments<\/h1>/);
    expect(markup).toContain('aria-label="Payment filters"');
    for (const label of [
      "Search",
      "Created",
      "Provider",
      "Currency",
      "Intent",
      "Status",
    ]) {
      expect(markup).toContain(`>${label}</label>`);
    }
    for (const header of [
      "Reference",
      "User",
      "Provider",
      "Intent",
      "Amount",
      "Status",
      "Created",
      "Completed",
    ]) {
      expect(markup).toContain(`>${header}</th>`);
    }
    expect(markup).toMatch(/NGN\s15,000\.00/);
    expect(markup).toContain("Not completed");
    expect(markup).toContain(">Not available<");
    expect(markup).toContain(">ProviderReview</span>");
    expect(markup).toContain("Showing 1–7 of 7");
    expect(markup).toContain("max-md:block");
  });

  it("omits row links while no detail route exists", () => {
    const markup = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        state={fixturePaymentList()}
      />,
    );
    expect(markup).not.toContain("<a ");
    const linked = render(
      <PaymentsScreen
        detailHref={(row) => `/payments/${row.id}`}
        filters={DEFAULT_PAYMENT_FILTERS}
        state={fixturePaymentList()}
      />,
    );
    expect(linked).toContain('href="/payments/pay-fixture-1"');
  });

  it("disables filters and export without handlers", () => {
    const markup = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        state={fixturePaymentList()}
      />,
    );
    expect(markup).toContain(
      "Filters apply once the admin billing API is available.",
    );
    expect(markup).toMatch(
      /<button[^>]*data-intent="exportCsv"[^>]*disabled=""/,
    );
    expect(markup).toContain("Export is not available yet.");
    expect((markup.match(/<select[^>]*disabled=""/g) ?? []).length).toBe(5);
    expect(markup).toMatch(/<input[^>]*type="search"[^>]*disabled=""/);
  });

  it("enables export only with a handler and a ready list", () => {
    const ready = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        onExport={noop}
        state={fixturePaymentList()}
      />,
    );
    expect(ready).not.toMatch(
      /<button[^>]*data-intent="exportCsv"[^>]*disabled=""/,
    );
    const loading = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        onExport={noop}
        state={{ state: "loading" }}
      />,
    );
    expect(loading).toMatch(
      /<button[^>]*data-intent="exportCsv"[^>]*disabled=""/,
    );
  });

  it("distinguishes empty, filtered-empty, unavailable, loading and error", () => {
    const empty = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        state={fixturePaymentList([])}
      />,
    );
    expect(empty).toContain("No payments yet");
    const filtered = render(
      <PaymentsScreen
        filters={{ ...DEFAULT_PAYMENT_FILTERS, status: "Failed" }}
        state={fixturePaymentList([])}
      />,
    );
    expect(filtered).toContain("No payments match these filters");
    const unavailable = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        onFiltersChange={noop}
        state={{
          reason: "Needs the admin payments API.",
          state: "unavailable",
        }}
      />,
    );
    expect(unavailable).toContain("Needs the admin payments API.");
    expect(unavailable).not.toContain("No payments yet");
    expect(unavailable).toContain("Filters apply once");
    const loading = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        state={{ state: "loading" }}
      />,
    );
    expect(loading).toContain("Loading payments");
    expect(loading).toContain('aria-busy="true"');
    const error = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        onRetry={noop}
        state={{ state: "error" }}
      />,
    );
    expect(error).toContain('role="alert"');
    expect(error).toContain("Try again");
  });

  it("renders the in-shell forbidden state", () => {
    const markup = render(
      <PaymentsScreen
        filters={DEFAULT_PAYMENT_FILTERS}
        state={{ state: "forbidden" }}
      />,
    );
    expect(markup).toContain("Error 403");
    expect(markup).toContain("Payments");
    expect(markup).not.toContain("<table");
  });
});

describe("PaymentDetailScreen", () => {
  it("renders the transaction, outcome, timeline and provider events", () => {
    const markup = render(
      <PaymentDetailScreen
        state={{ record: fixturePaymentDetail(), state: "ready" }}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>FIX-PAY-0004<\/h1>/);
    expect(markup).toContain(">Failed</span>");
    for (const text of [
      "Merchant reference",
      "Provider reference",
      "Fixture Tenant",
      "Hosted checkout",
      "Not fulfilled",
      "FIXTURE: the provider declined the charge.",
      'aria-label="Payment status history"',
      "14 Jan 2026, 10:02 UTC",
      "fixture.charge.failed",
      "Confirmed failed",
    ]) {
      expect(markup).toContain(text);
    }
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("<button");
    expect(markup).not.toMatch(/invoice|refund/i);
  });

  it("states missing history and event logs instead of fabricating them", () => {
    const markup = render(
      <PaymentDetailScreen
        state={{
          record: fixturePaymentDetail({
            providerEvents: null,
            statusHistory: null,
          }),
          state: "ready",
        }}
      />,
    );
    expect(markup).toContain(
      "Status history is not available for this payment.",
    );
    expect(markup).toContain("The provider event log is not available");
  });

  it("renders loading, error, not found and unavailable states", () => {
    expect(
      render(<PaymentDetailScreen state={{ state: "loading" }} />),
    ).toContain("Loading payment");
    expect(
      render(<PaymentDetailScreen state={{ state: "error" }} />),
    ).toContain("Couldn&#x27;t load payment");
    expect(
      render(<PaymentDetailScreen state={{ state: "notFound" }} />),
    ).toContain("Payment not found");
    expect(
      render(
        <PaymentDetailScreen
          state={{
            reason: "Needs the admin payments API.",
            state: "unavailable",
          }}
        />,
      ),
    ).toContain("Needs the admin payments API.");
  });
});

describe("production boundary", () => {
  const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));

  function productionFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return productionFiles(path);
      return /\.tsx?$/.test(entry) && !/\.(test|fixtures)\.tsx?$/.test(entry)
        ? [path]
        : [];
    });
  }

  it("never imports the preview fixtures from production modules", () => {
    const files = productionFiles(sourceRoot);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /payments-preview\.fixtures/,
      );
    }
  });

  it("adds no route, navigation entry or production import", () => {
    expect(() => statSync(join(sourceRoot, "app", "payments"))).toThrow();
    const navigation = readFileSync(
      join(sourceRoot, "config", "navigation.ts"),
      "utf8",
    );
    expect(navigation).not.toMatch(/"\/payments/);
    for (const file of productionFiles(join(sourceRoot, "app"))) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /features\/admin-payments/,
      );
    }
  });
});
