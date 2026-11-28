import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  fixtureInvoice,
  fixtureReceipt,
  invoicePreviews,
  receiptPreviews,
} from "./billing-documents-preview.fixtures";
import { InvoiceDetailScreen } from "./invoice-detail-screen";
import { ReceiptDetailScreen } from "./receipt-detail-screen";

/*
 * Static rendering of USR-INVOICE-DETAIL and USR-RECEIPT-DETAIL (no route,
 * BE-DS-007). Layout, print and responsive behaviour are covered by
 * `billing-documents.browser.test.tsx`.
 */

const render = (node: ReactNode) =>
  renderToStaticMarkup(node).replace(/ /g, " ");
const back = { href: "/billing/history", label: "Billing history" };
const receiptHref = (id: string) => `/billing/receipts/${id}`;
const invoiceHref = (id: string) => `/billing/invoices/${id}`;

function invoice(name: keyof typeof invoicePreviews, props: object = {}) {
  return render(
    <InvoiceDetailScreen
      back={back}
      brandName="Template"
      state={invoicePreviews[name]!}
      {...props}
    />,
  );
}

describe("InvoiceDetailScreen", () => {
  it("renders the due variant: heading, document, summary and back link", () => {
    const markup = invoice("due");
    expect(markup).toContain('data-invoice-variant="due"');
    expect(markup).toMatch(/<h1[^>]*>Invoice FIX-INV-0142<\/h1>/);
    expect(markup).toMatch(/<article[^>]*aria-labelledby=/);
    expect(markup).toMatch(/<h2[^>]*>Invoice<\/h2>/);
    for (const text of [
      "Fixture Standard plan · 14 Jan 2026 – 14 Feb 2026",
      "Billed to",
      "Payment due by 21 Jan 2026.",
      "Amount due",
      "NGN 15,000.00",
      ">Due</span>",
    ]) {
      expect(markup, text).toContain(text);
    }
    expect(markup).toContain('href="/billing/history"');
  });

  it("renders the overdue variant from the status", () => {
    const markup = invoice("overdue");
    expect(markup).toContain('data-invoice-variant="overdue"');
    expect(markup).toContain("Overdue since 21 Jan 2026.");
  });

  it("renders the paid variant and links the receipt by its id", () => {
    const markup = invoice("paid", { receiptHref });
    expect(markup).toContain('data-invoice-variant="paid"');
    expect(markup).toContain("Ref FIXPAY-8812");
    expect(markup).toContain('href="/billing/receipts/rct-fixture-0331"');
  });

  it("offers no payment action and disables PDF and email with a reason", () => {
    for (const name of ["due", "overdue"] as const) {
      expect(invoice(name)).not.toMatch(/>Pay\b|Pay now/);
    }
    const markup = invoice("due");
    expect(markup).toMatch(
      /<button[^>]*aria-describedby="document-actions-hint"[^>]*disabled=""[^>]*>.*Download PDF/,
    );
    expect(markup).toMatch(/disabled=""[^>]*>.*Email me a copy/);
    expect(markup).toContain(
      "PDF download and email copies are not available yet.",
    );
    expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*>.*?Print</);
  });

  it("links a receipt only with a receipt id and a URL builder", () => {
    expect(invoice("paid")).not.toContain("View receipt");
    const markup = render(
      <InvoiceDetailScreen
        brandName="Template"
        receiptHref={receiptHref}
        state={{
          document: fixtureInvoice({
            payment: {
              method: null,
              paidAtUtc: "2026-01-14T10:01:00Z",
              receiptId: null,
              receiptNumber: null,
              reference: "FIXPAY-8812",
            },
            status: "Paid",
          }),
          state: "ready",
        }}
      />,
    );
    expect(markup).not.toContain("/billing/receipts/");
  });

  it("marks page controls and the summary as print-hidden", () => {
    const markup = invoice("due");
    expect(markup).toMatch(/<a[^>]*print:hidden[^>]*href="\/billing\/history"/);
    expect(markup).toMatch(/<aside[^>]*print:hidden/);
    expect(markup).toMatch(/<article[^>]*data-print-paper=""/);
  });

  it("renders non-ready states without a document", () => {
    expect(invoice("loading")).toContain("Loading invoice");
    expect(invoice("error")).toContain("Couldn&#x27;t load this invoice");
    expect(invoice("notFound")).toContain("Invoice not found");
    expect(invoice("unavailable")).toContain("Invoices are not available");
    for (const name of [
      "loading",
      "error",
      "notFound",
      "unavailable",
    ] as const) {
      expect(invoice(name)).not.toContain("<article");
    }
  });
});

describe("ReceiptDetailScreen", () => {
  const receipt = (name: keyof typeof receiptPreviews, props: object = {}) =>
    render(
      <ReceiptDetailScreen
        brandName="Template"
        state={receiptPreviews[name]!}
        {...props}
      />,
    );

  it("renders a subscription receipt linked to its invoice by id", () => {
    const markup = receipt("subscription", { invoiceHref });
    expect(markup).toContain('data-receipt-kind="subscription"');
    expect(markup).toMatch(/<h1[^>]*>Receipt FIX-RCT-0331<\/h1>/);
    for (const text of [
      "Paid on 14 Jan 2026 · 10:01 UTC",
      "Received from",
      "FIXPAY-8812",
      "Total paid",
    ]) {
      expect(markup, text).toContain(text);
    }
    expect(markup).toContain('href="/billing/invoices/inv-fixture-0142"');
  });

  it("shows the invoice number without a link when there is no invoice id", () => {
    const markup = render(
      <ReceiptDetailScreen
        brandName="Template"
        invoiceHref={invoiceHref}
        state={{
          document: fixtureReceipt({
            invoice: { id: null, invoiceNumber: "FIX-INV-0142" },
          }),
          state: "ready",
        }}
      />,
    );
    expect(markup).toContain("FIX-INV-0142");
    expect(markup).not.toContain("/billing/invoices/");
  });

  it("renders a wallet receipt from the same composition", () => {
    const markup = receipt("wallet");
    expect(markup).toContain('data-receipt-kind="wallet"');
    expect(markup).toContain("FIX-WTX-21F9");
    expect(markup).toContain("NGN 20,000.00");
    expect(markup).not.toContain("FIX-INV");
  });

  it("renders non-ready states without a receipt", () => {
    expect(receipt("notFound")).toContain("Receipt not found");
    expect(receipt("loading")).not.toContain("<article");
  });
});

describe("production boundary", () => {
  const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));
  const featureRoot = fileURLToPath(new URL(".", import.meta.url));

  function sourceFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(entry) ? [path] : [];
    });
  }

  const isProduction = (file: string) =>
    !/\.test\.tsx?$/.test(file) && !file.endsWith(".fixtures.ts");

  it("never imports the preview fixtures or the feature from production code", () => {
    const files = sourceFiles(sourceRoot).filter(isProduction);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(
        /from "[^"]*billing-documents-preview\.fixtures"/,
      );
      if (!file.startsWith(featureRoot)) {
        expect(source, file).not.toMatch(/features\/billing-documents/);
      }
    }
  });

  it("makes no API call", () => {
    for (const file of sourceFiles(featureRoot).filter(isProduction)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/from "@template\/api-(client|react)/);
      expect(source, file).not.toMatch(/fetch\(|NEXT_PUBLIC_|@\/lib\/billing/);
    }
  });

  it("adds no production route or navigation entry", () => {
    const app = join(sourceRoot, "app");
    for (const route of [
      ["billing", "invoices"],
      ["billing", "receipts"],
      ["invoices"],
      ["receipts"],
    ]) {
      expect(() => statSync(join(app, ...route))).toThrow();
    }
    expect(
      readFileSync(join(sourceRoot, "config", "navigation.ts"), "utf8"),
    ).not.toMatch(/invoice|receipt/i);
  });
});
