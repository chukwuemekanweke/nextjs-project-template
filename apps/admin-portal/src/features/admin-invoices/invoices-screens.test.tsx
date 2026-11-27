import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { adminNavigation } from "@/config/navigation";
import { InvoiceDetailScreen } from "./invoice-detail";
import {
  ADMIN_INVOICES_UNAVAILABLE_REASON,
  DEFAULT_INVOICE_FILTERS,
  adminInvoiceDocumentContent,
  describeInvoiceStatus,
  hasActiveInvoiceFilters,
  invoiceFiltersToSearchParams,
  parseInvoiceFilters,
} from "./invoices-model";
import { InvoicesScreen } from "./invoices-list";
import {
  fixtureInvoiceDetail,
  fixtureInvoiceList,
  fixtureInvoiceSummary,
  unavailableInvoiceSummary,
} from "./invoices-preview.fixtures";

/*
 * Preview harness for ADM-INVOICES and ADM-INVOICE-DETAIL (no route,
 * DR-160). Every state renders from typed fixtures.
 */

const render = (node: ReactNode) =>
  renderToStaticMarkup(node).replace(/ /g, " ");
const noop = () => undefined;

describe("invoice filters and status", () => {
  it("parses URL params, dropping unknown statuses", () => {
    expect(
      parseInvoiceFilters(
        new URLSearchParams("q=%20FIX-INV%20&status=Bogus&range=7d"),
      ),
    ).toEqual({ query: "FIX-INV", range: "7d", status: "" });
    const filters = { ...DEFAULT_INVOICE_FILTERS, status: "Overdue" };
    const params = invoiceFiltersToSearchParams(filters);
    expect(params.toString()).toBe("status=Overdue");
    expect(parseInvoiceFilters(params)).toEqual(filters);
    expect(hasActiveInvoiceFilters(DEFAULT_INVOICE_FILTERS)).toBe(false);
  });

  it("maps backend statuses and never reads unknown as paid", () => {
    expect(describeInvoiceStatus("Paid")).toEqual({
      label: "Paid",
      tone: "success",
    });
    expect(describeInvoiceStatus("Overdue").tone).toBe("danger");
    expect(describeInvoiceStatus("ProviderReview")).toEqual({
      label: "ProviderReview",
      tone: "neutral",
    });
  });
});

describe("InvoicesScreen", () => {
  it("renders KPIs, filters and the eight reference columns", () => {
    const markup = render(
      <InvoicesScreen
        filters={DEFAULT_INVOICE_FILTERS}
        onFiltersChange={noop}
        state={fixtureInvoiceList()}
        summary={fixtureInvoiceSummary}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>Invoices &amp; receipts<\/h1>/);
    for (const kpi of [
      "Invoiced (30d)",
      "Collected (30d)",
      "Outstanding",
      "Overdue",
    ]) {
      expect(markup).toContain(`data-kpi="${kpi}"`);
    }
    expect(markup).toContain('aria-label="Invoice filters"');
    for (const header of [
      "Invoice",
      "Customer",
      "Plan",
      "Amount",
      "Status",
      "Issued",
      "Due",
      "Receipt",
    ]) {
      expect(markup).toContain(`>${header}</th>`);
    }
    expect(markup).toContain("NGN 15,000.00");
    expect(markup).toContain("Fixture Standard · monthly");
    for (const status of ["Paid", "Due", "Overdue", "Void", "ProviderReview"]) {
      expect(markup).toContain(`>${status}</span>`);
    }
    expect(markup).toContain("No receipt");
    expect(markup).toContain("No due date");
    expect(markup).toContain("Showing 1–6 of 6");
    expect(markup).toContain("max-md:block");
  });

  it("shows unavailable KPIs as text, never as zero", () => {
    const markup = render(
      <InvoicesScreen
        filters={DEFAULT_INVOICE_FILTERS}
        state={fixtureInvoiceList()}
        summary={unavailableInvoiceSummary}
      />,
    );
    expect(markup.match(/data-state="unavailable"/g)).toHaveLength(4);
    expect(markup).not.toMatch(/NGN 0\.00/);
  });

  it("links rows only through a detail URL built from the invoice id", () => {
    const plain = render(
      <InvoicesScreen
        filters={DEFAULT_INVOICE_FILTERS}
        state={fixtureInvoiceList()}
        summary={unavailableInvoiceSummary}
      />,
    );
    expect(plain).not.toContain("<a ");
    const linked = render(
      <InvoicesScreen
        detailHref={(row) => `/invoices/${row.id}`}
        filters={DEFAULT_INVOICE_FILTERS}
        state={fixtureInvoiceList()}
        summary={unavailableInvoiceSummary}
      />,
    );
    expect(linked).toContain('href="/invoices/inv-fixture-1"');
    expect(linked).not.toMatch(/href="[^"]*FIX-(INV|RCT|PAY)/);
  });

  it("disables filters and export without handlers", () => {
    const markup = render(
      <InvoicesScreen
        filters={DEFAULT_INVOICE_FILTERS}
        state={fixtureInvoiceList()}
        summary={unavailableInvoiceSummary}
      />,
    );
    expect(markup).toContain(
      "Filters apply once the admin billing API is available.",
    );
    expect(markup).toMatch(
      /<button[^>]*data-intent="exportCsv"[^>]*disabled=""/,
    );
    expect(markup).toContain("Export is not available yet.");
    expect(markup).toMatch(/<input[^>]*type="search"[^>]*disabled=""/);
    const ready = render(
      <InvoicesScreen
        filters={DEFAULT_INVOICE_FILTERS}
        onExport={noop}
        state={fixtureInvoiceList()}
        summary={unavailableInvoiceSummary}
      />,
    );
    expect(ready).not.toMatch(/data-intent="exportCsv"[^>]*disabled=""/);
  });

  it("distinguishes loading, error, empty, unavailable and forbidden", () => {
    const at = (state: Parameters<typeof InvoicesScreen>[0]["state"]) =>
      render(
        <InvoicesScreen
          filters={DEFAULT_INVOICE_FILTERS}
          onRetry={noop}
          state={state}
          summary={unavailableInvoiceSummary}
        />,
      );
    expect(at({ state: "loading" })).toContain("Loading invoices");
    expect(at({ state: "error" })).toContain("Couldn&#x27;t load this list");
    expect(at(fixtureInvoiceList([]))).toContain("No invoices yet");
    const unavailable = at({
      reason: ADMIN_INVOICES_UNAVAILABLE_REASON,
      state: "unavailable",
    });
    expect(unavailable).toContain(ADMIN_INVOICES_UNAVAILABLE_REASON);
    expect(unavailable).not.toContain("No invoices yet");
    const forbidden = at({ permission: "invoices.read", state: "forbidden" });
    expect(forbidden).toContain("invoices.read");
    expect(forbidden).not.toContain("<table");
  });
});

describe("InvoiceDetailScreen", () => {
  it("renders the document, related records and history", () => {
    const markup = render(
      <InvoiceDetailScreen
        backHref="/invoices"
        brandName="Template"
        state={{ record: fixtureInvoiceDetail(), state: "ready" }}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>FIX-INV-0142<\/h1>/);
    expect(markup).toContain("Fixture Customer 2 · Fixture Standard · monthly");
    expect(markup).toMatch(/<article[^>]*theme-light/);
    expect(markup).toMatch(/<h2[^>]*>Invoice<\/h2>/);
    for (const text of [
      "Billed to",
      "Fixture Issuer Ltd",
      "VAT (7.5%)",
      "NGN 15,000.00",
      "Amount due",
      "Paid on 12 Jan 2026 · Fixture Provider · card · Ref FIXPAY-0002 · Receipt FIX-RCT-0142",
      "Receipt emailed",
      "Invoice issued",
    ]) {
      expect(markup, text).toContain(text);
    }
    expect(markup).toContain('href="/invoices"');
  });

  it("links related records only through ids and URL builders", () => {
    const plain = render(
      <InvoiceDetailScreen
        brandName="Template"
        state={{ record: fixtureInvoiceDetail(), state: "ready" }}
      />,
    );
    expect(plain).not.toContain("<a ");
    const linked = render(
      <InvoiceDetailScreen
        brandName="Template"
        customerHref={(id) => `/users/${id}`}
        paymentHref={(id) => `/payments/${id}`}
        state={{ record: fixtureInvoiceDetail(), state: "ready" }}
        subscriptionHref={(id) => `/subscriptions/${id}`}
      />,
    );
    expect(linked).toContain('href="/users/user-fixture-2"');
    expect(linked).toContain('href="/payments/pay-fixture-2"');
    expect(linked).toContain('href="/subscriptions/sub-fixture-2"');
  });

  it("keeps resend and download disabled unless available and handled", () => {
    const unavailable = render(
      <InvoiceDetailScreen
        brandName="Template"
        onAction={noop}
        state={{ record: fixtureInvoiceDetail(), state: "ready" }}
      />,
    );
    expect(unavailable).toMatch(/data-intent="resend"[^>]*disabled=""/);
    expect(unavailable).toMatch(/data-intent="downloadPdf"[^>]*disabled=""/);
    expect(unavailable).toContain("FIXTURE: resending is not available.");
    expect(unavailable).not.toMatch(/data-intent="print"[^>]*disabled=""/);

    const record = fixtureInvoiceDetail({
      actions: {
        downloadPdf: { state: "available" },
        resend: { state: "available" },
      },
    });
    const noHandler = render(
      <InvoiceDetailScreen
        brandName="Template"
        state={{ record, state: "ready" }}
      />,
    );
    expect(noHandler).toMatch(/data-intent="resend"[^>]*disabled=""/);
    expect(noHandler).toContain("Printing is not available here.");
    const handled = render(
      <InvoiceDetailScreen
        brandName="Template"
        onAction={noop}
        state={{ record, state: "ready" }}
      />,
    );
    expect(handled).not.toMatch(/disabled=""/);
  });

  it("renders due and overdue invoices without payment claims", () => {
    const due = adminInvoiceDocumentContent(
      fixtureInvoiceDetail({ amountPaid: null, payment: null, status: "Due" }),
    );
    expect(due.notice).toEqual({
      content: "Payment due by 19 Jan 2026.",
      tone: "warning",
    });
    const overdue = adminInvoiceDocumentContent(
      fixtureInvoiceDetail({ payment: null, status: "Overdue" }),
    );
    expect(overdue.notice?.tone).toBe("danger");
    expect(
      adminInvoiceDocumentContent(fixtureInvoiceDetail({ status: "Void" }))
        .notice,
    ).toBeUndefined();
  });

  it("hides header, cards and controls in print but keeps the document", () => {
    const markup = render(
      <InvoiceDetailScreen
        brandName="Template"
        onAction={noop}
        state={{ record: fixtureInvoiceDetail(), state: "ready" }}
      />,
    );
    expect(markup).toMatch(/<div[^>]*print:hidden[^>]*data-print-hidden=""/);
    expect(markup).toMatch(/<aside[^>]*print:hidden/);
    expect(markup).toMatch(/<article[^>]*print:p-0/);
  });

  it("renders non-ready states without a document", () => {
    for (const [state, text] of [
      [{ state: "loading" }, "Loading invoice"],
      [{ state: "notFound" }, "Invoice not found"],
      [{ state: "error" }, "Couldn&#x27;t load invoice"],
      [
        { reason: ADMIN_INVOICES_UNAVAILABLE_REASON, state: "unavailable" },
        ADMIN_INVOICES_UNAVAILABLE_REASON,
      ],
      [{ permission: "invoices.read", state: "forbidden" }, "invoices.read"],
    ] as const) {
      const markup = render(
        <InvoiceDetailScreen brandName="Template" state={state} />,
      );
      expect(markup, text).toContain(text);
      expect(markup).not.toContain("<article");
    }
  });
});

describe("admin invoice navigation", () => {
  it("adds no Invoices navigation item while the screens are preview-only", () => {
    const hrefs = adminNavigation.flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(hrefs).not.toContain("/invoices");
  });
});
