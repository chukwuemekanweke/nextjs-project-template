import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { adminNavigation } from "@/config/navigation";
import { InvoiceDetailScreen } from "./invoice-detail";
import {
  describeInvoiceStatus,
  invoiceDocumentContent,
} from "./invoices-model";
import { InvoicesScreen } from "./invoices-list";
import {
  fixtureInvoiceDetail,
  fixtureInvoiceSummary,
  invoiceDetailPreviews,
  invoiceListPreviews,
  unavailableInvoiceSummary,
} from "./invoices-preview.fixtures";

/*
 * Static rendering of ADM-INVOICES and ADM-INVOICE-DETAIL (no route,
 * BE-DS-007). Layout, print and responsive behaviour are covered by
 * `invoices-screens.browser.test.tsx`.
 */

const render = (node: ReactNode) =>
  renderToStaticMarkup(node).replace(/ /g, " ");

describe("describeInvoiceStatus", () => {
  it("maps known statuses", () => {
    expect(describeInvoiceStatus("Paid")).toEqual({
      label: "Paid",
      tone: "success",
    });
    expect(describeInvoiceStatus("Open").label).toBe("Due");
    expect(describeInvoiceStatus("Overdue").tone).toBe("danger");
  });

  it.each(["constructor", "toString", "__proto__", "ProviderReview"])(
    "shows unknown status %s as returned, never as an inherited property",
    (status) => {
      expect(describeInvoiceStatus(status)).toEqual({
        label: status,
        tone: "neutral",
      });
    },
  );
});

describe("InvoicesScreen", () => {
  const list = (name: keyof typeof invoiceListPreviews, props: object = {}) =>
    render(
      <InvoicesScreen
        state={invoiceListPreviews[name]!}
        summary={fixtureInvoiceSummary}
        {...props}
      />,
    );

  it("renders KPIs, filters and the eight reference columns", () => {
    const markup = list("ready");
    expect(markup).toMatch(/<h1[^>]*>Invoices &amp; receipts<\/h1>/);
    for (const kpi of [
      "Invoiced (30d)",
      "Collected (30d)",
      "Outstanding",
      "Overdue",
    ]) {
      expect(markup).toContain(`data-kpi="${kpi}"`);
    }
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
    for (const status of ["Paid", "Due", "Overdue", "Void", "ProviderReview"]) {
      expect(markup).toContain(`>${status}</span>`);
    }
    expect(markup).toContain("No receipt");
    expect(markup).toContain("Showing 1–6 of 6");
  });

  it("disables export and filters with their reason", () => {
    const markup = list("ready");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>.*Export CSV/);
    expect(markup).toContain("Export is not available yet.");
    expect(markup).toMatch(/<select[^>]*disabled=""/);
    expect(markup).toContain(
      "Filters apply once the admin billing API is available.",
    );
  });

  it("shows unavailable KPIs as text, never as zero", () => {
    const markup = render(
      <InvoicesScreen
        state={invoiceListPreviews.ready!}
        summary={unavailableInvoiceSummary}
      />,
    );
    expect(markup.match(/data-state="unavailable"/g)).toHaveLength(4);
  });

  it("links rows only through a detail URL built from the invoice id", () => {
    expect(list("ready")).not.toContain("<a ");
    const linked = list("ready", {
      detailHref: (row: { id: string }) => `/invoices/${row.id}`,
    });
    expect(linked).toContain('href="/invoices/inv-fixture-1"');
  });

  it("distinguishes loading, error, empty, unavailable and forbidden", () => {
    expect(list("loading")).toContain("Loading invoices");
    expect(list("error")).toContain("Couldn&#x27;t load this list");
    expect(list("empty")).toContain("No invoices yet");
    expect(list("unavailable")).toContain(
      "The backend has no invoice API yet.",
    );
    expect(list("forbidden")).toContain("invoices.read");
    expect(list("forbidden")).not.toContain("<table");
  });
});

describe("InvoiceDetailScreen", () => {
  const detail = (
    name: keyof typeof invoiceDetailPreviews,
    props: object = {},
  ) =>
    render(
      <InvoiceDetailScreen
        brandName="Template"
        state={invoiceDetailPreviews[name]!}
        {...props}
      />,
    );

  it("renders the document, related records and history", () => {
    const markup = detail("paid", { backHref: "/invoices" });
    expect(markup).toMatch(/<h1[^>]*>FIX-INV-0142<\/h1>/);
    expect(markup).toMatch(/<article[^>]*data-print-paper=""/);
    for (const text of [
      "Fixture Customer 2 · Fixture Standard · monthly",
      "Billed to",
      "Amount due",
      "Paid on 12 Jan 2026 · Fixture Provider · card · Ref FIXPAY-0002 · Receipt FIX-RCT-0142",
      "Receipt emailed",
    ]) {
      expect(markup, text).toContain(text);
    }
    expect(markup).toContain('href="/invoices"');
  });

  it("renders due and overdue notices without payment claims", () => {
    expect(detail("due")).toContain("Payment due by 19 Jan 2026.");
    expect(detail("overdue")).toContain("Payment overdue since 19 Jan 2026.");
    expect(
      invoiceDocumentContent(fixtureInvoiceDetail({ status: "Void" })).notice,
    ).toBeUndefined();
  });

  it("links related records only through ids and URL builders", () => {
    expect(detail("paid")).not.toContain("<a ");
    const linked = detail("paid", {
      customerHref: (id: string) => `/users/${id}`,
      paymentHref: (id: string) => `/payments/${id}`,
      subscriptionHref: (id: string) => `/subscriptions/${id}`,
    });
    expect(linked).toContain('href="/users/user-fixture-2"');
    expect(linked).toContain('href="/payments/pay-fixture-2"');
    expect(linked).toContain('href="/subscriptions/sub-fixture-2"');
  });

  it("disables resend and download with their reason, keeps print", () => {
    const markup = detail("paid");
    expect(markup).toMatch(/disabled=""[^>]*>.*Resend to customer/);
    expect(markup).toMatch(/disabled=""[^>]*>.*Download PDF/);
    expect(markup).toContain(
      "Resending and PDF download are not available yet.",
    );
    expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*>.*?Print</);
  });

  it("renders non-ready states without a document", () => {
    for (const [name, text] of [
      ["loading", "Loading invoice"],
      ["notFound", "Invoice not found"],
      ["error", "Couldn&#x27;t load invoice"],
      ["unavailable", "The backend has no invoice API yet."],
      ["forbidden", "invoices.read"],
    ] as const) {
      const markup = detail(name);
      expect(markup, text).toContain(text);
      expect(markup).not.toContain("<article");
    }
  });
});

it("adds no Invoices navigation item while the screens are preview-only", () => {
  const hrefs = adminNavigation.flatMap((group) =>
    group.items.map((item) => item.href),
  );
  expect(hrefs).not.toContain("/invoices");
});
