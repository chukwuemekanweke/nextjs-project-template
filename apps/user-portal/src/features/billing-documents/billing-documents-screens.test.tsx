import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BILLING_DOCUMENTS_UNAVAILABLE_REASON,
  type DocumentReadState,
  type UserInvoice,
  type UserReceipt,
} from "./billing-documents-model";
import {
  fixtureDueInvoice,
  fixtureInvoice,
  fixtureLongInvoice,
  fixtureOverdueInvoice,
  fixturePaidInvoice,
  fixtureReceipt,
  fixtureSubscriptionReceipt,
  fixtureWalletReceipt,
} from "./billing-documents-preview.fixtures";
import { InvoiceDetailScreen } from "./invoice-detail-screen";
import { ReceiptDetailScreen } from "./receipt-detail-screen";

/*
 * Preview harness for USR-INVOICE-DETAIL and USR-RECEIPT-DETAIL (no route,
 * DR-160). Every variant renders from typed fixtures; print media behaviour
 * of the shared sheet and shell is covered by the dashboard-ui browser
 * tests.
 */

const render = (node: ReactNode) =>
  renderToStaticMarkup(node).replace(/ /g, " ");
const noop = () => undefined;
const back = { href: "/billing/history", label: "Billing history" };

function invoice(document: UserInvoice, props: object = {}) {
  return render(
    <InvoiceDetailScreen
      back={back}
      brandName="Template"
      state={{ document, state: "ready" }}
      {...props}
    />,
  );
}

function receipt(document: UserReceipt, props: object = {}) {
  return render(
    <ReceiptDetailScreen
      brandName="Template"
      state={{ document, state: "ready" }}
      {...props}
    />,
  );
}

describe("InvoiceDetailScreen", () => {
  it("renders the due variant with document and summary", () => {
    const markup = invoice(fixtureDueInvoice);
    expect(markup).toContain('data-invoice-variant="due"');
    expect(markup).toMatch(/<h1[^>]*>Invoice FIX-INV-0142<\/h1>/);
    expect(markup).toContain(
      "Fixture Standard plan · 14 Jan 2026 – 14 Feb 2026",
    );
    expect(markup).toMatch(/<article[^>]*aria-labelledby=/);
    expect(markup).toMatch(/<h2[^>]*>Invoice<\/h2>/);
    expect(markup).toContain(">Due</span>");
    for (const text of [
      "Billed to",
      "Fixture Customer",
      "From",
      "Fixture Issuer Ltd",
      "Issue date",
      "14 Jan 2026",
      "Due date",
      "21 Jan 2026",
      "Billing period",
      "Payment due by 21 Jan 2026.",
      "VAT (7.5%)",
      "NGN 15,000.00",
    ]) {
      expect(markup, text).toContain(text);
    }
    expect(markup).toMatch(/<caption[^>]*>Invoice FIX-INV-0142 line items/);
    expect(markup).toContain('href="/billing/history"');
  });

  it("renders the overdue variant from the backend status", () => {
    const markup = invoice(fixtureOverdueInvoice);
    expect(markup).toContain('data-invoice-variant="overdue"');
    expect(markup).toContain(">Overdue</span>");
    expect(markup).toContain("Overdue since 21 Jan 2026.");
    expect(markup).toContain("Payment overdue since 21 Jan 2026.");
  });

  it("renders the paid variant with payment details and no amount due action", () => {
    const markup = invoice(fixturePaidInvoice, {
      receiptHref: (id: string) => `/billing/receipts/${id}`,
    });
    expect(markup).toContain('data-invoice-variant="paid"');
    expect(markup).toContain(">Paid</span>");
    expect(markup).toContain("Paid on");
    expect(markup).toContain("Ref FIXPAY-8812");
    expect(markup).toContain('href="/billing/receipts/rct-fixture-0331"');
    expect(markup).not.toContain('data-intent="pay"');
    expect(markup).not.toContain("Online payment is not available");
  });

  it("never offers payment for a due invoice without a supported integration", () => {
    const withHandler = invoice(fixtureDueInvoice, { onAction: noop });
    expect(withHandler).not.toContain('data-intent="pay"');
    expect(withHandler).toContain(
      "Online payment is not available for this invoice.",
    );
    const supportedNoHandler = invoice(
      fixtureInvoice({
        capabilities: { downloadPdf: false, emailCopy: false, pay: true },
      }),
    );
    expect(supportedNoHandler).not.toContain('data-intent="pay"');
    const supported = invoice(
      fixtureInvoice({
        capabilities: { downloadPdf: false, emailCopy: false, pay: true },
      }),
      { onAction: noop },
    );
    expect(supported).toMatch(/<button[^>]*data-intent="pay"/);
    expect(supported).toContain("Pay NGN 15,000.00");
  });

  it("disables unsupported document actions with a visible reason", () => {
    const markup = invoice(fixtureDueInvoice);
    for (const intent of ["print", "downloadPdf", "emailCopy"]) {
      expect(markup).toMatch(
        new RegExp(
          `<button[^>]*aria-describedby="[^"]+"[^>]*data-intent="${intent}"[^>]*disabled=""`,
        ),
      );
    }
    expect(markup).toContain("Printing is not available here.");
    expect(markup).toContain("PDF download is not available yet.");
    expect(markup).toContain("Emailing a copy is not available yet.");
  });

  it("enables print with a handler and other actions only when supported", () => {
    const markup = invoice(fixtureDueInvoice, { onAction: noop });
    expect(markup).not.toMatch(/data-intent="print"[^>]*disabled=""/);
    expect(markup).toMatch(/data-intent="downloadPdf"[^>]*disabled=""/);
    const supported = invoice(
      fixtureInvoice({
        capabilities: { downloadPdf: true, emailCopy: true, pay: false },
      }),
      { onAction: noop },
    );
    expect(supported).not.toMatch(/disabled=""/);
    expect(supported).not.toContain("not available yet");
  });

  it("links a receipt only with a real receipt id and a URL builder", () => {
    expect(invoice(fixturePaidInvoice)).not.toContain("View receipt");
    const noReceipt = invoice(
      fixtureInvoice({
        payment: {
          method: null,
          paidAtUtc: "2026-01-14T10:01:00Z",
          receiptId: null,
          receiptNumber: null,
          reference: "FIXPAY-8812",
        },
        status: "Paid",
      }),
      { receiptHref: (id: string) => `/billing/receipts/${id}` },
    );
    expect(noReceipt).not.toContain("View receipt");
    expect(noReceipt).not.toContain("/billing/receipts/");
  });

  it("hides page controls and the summary in print, not the document", () => {
    const markup = invoice(fixtureDueInvoice, { onAction: noop });
    expect(markup).toMatch(/<a[^>]*print:hidden[^>]*href="\/billing\/history"/);
    expect(markup).toMatch(/<div[^>]*print:hidden[^>]*data-print-hidden=""/);
    expect(markup).toMatch(/<aside[^>]*print:hidden/);
    expect(markup).toMatch(/<article[^>]*theme-light[^>]*print:p-0/);
  });

  it("renders every line item of a long invoice", () => {
    const markup = invoice(fixtureLongInvoice);
    expect(markup.match(/data-line-item=/g)).toHaveLength(40);
    expect(markup).toContain("Fixture line item 40");
  });

  it("renders loading, error, not found and unavailable without a document", () => {
    const states: DocumentReadState<UserInvoice>[] = [
      { state: "loading" },
      { state: "error" },
      { state: "notFound" },
      { reason: BILLING_DOCUMENTS_UNAVAILABLE_REASON, state: "unavailable" },
    ];
    const [loading, error, notFound, unavailable] = states.map((state) =>
      render(
        <InvoiceDetailScreen
          back={back}
          brandName="Template"
          onAction={noop}
          state={state}
        />,
      ),
    );
    expect(loading).toContain('role="status"');
    expect(loading).toContain("Loading invoice");
    expect(error).toContain("Couldn&#x27;t load this invoice");
    expect(error).toContain("Try again");
    expect(notFound).toContain("Invoice not found");
    expect(unavailable).toContain(BILLING_DOCUMENTS_UNAVAILABLE_REASON);
    for (const markup of [loading, error, notFound, unavailable]) {
      expect(markup).not.toContain("<article");
      expect(markup).not.toContain("NGN");
    }
  });
});

describe("ReceiptDetailScreen", () => {
  it("renders a subscription receipt linked to its invoice by id", () => {
    const markup = receipt(fixtureSubscriptionReceipt, {
      back,
      invoiceHref: (id: string) => `/billing/invoices/${id}`,
    });
    expect(markup).toContain('data-receipt-kind="subscription"');
    expect(markup).toMatch(/<h1[^>]*>Receipt FIX-RCT-0331<\/h1>/);
    expect(markup).toMatch(/<h2[^>]*>Receipt<\/h2>/);
    for (const text of [
      "Amount paid",
      "Paid on 14 Jan 2026 · 10:01 UTC",
      "Received from",
      "Paid to",
      "Payment method",
      "Fixture Provider · card",
      "Payment reference",
      "FIXPAY-8812",
      "Total paid",
      "NGN 15,000.00",
    ]) {
      expect(markup, text).toContain(text);
    }
    expect(markup).toContain('href="/billing/invoices/inv-fixture-0142"');
  });

  it("shows the invoice number without a link when there is no invoice id", () => {
    const markup = receipt(
      fixtureReceipt({
        invoice: { id: null, invoiceNumber: "FIX-INV-0142" },
      }),
      { invoiceHref: (id: string) => `/billing/invoices/${id}` },
    );
    expect(markup).toContain("FIX-INV-0142");
    expect(markup).not.toContain("/billing/invoices/");
  });

  it("renders a wallet receipt from the same composition", () => {
    const markup = receipt(fixtureWalletReceipt, {
      back: { href: "/billing", label: "Billing" },
    });
    expect(markup).toContain('data-receipt-kind="wallet"');
    expect(markup).toContain("Wallet top-up");
    expect(markup).toContain("FIX-WTX-21F9");
    expect(markup).toContain("NGN 20,000.00");
    expect(markup).toContain(">Fees<");
    expect(markup).not.toContain("FIX-INV");
  });

  it("disables email and download without backend support", () => {
    const markup = receipt(fixtureSubscriptionReceipt, { onAction: noop });
    expect(markup).toMatch(/data-intent="emailCopy"[^>]*disabled=""/);
    expect(markup).toMatch(/data-intent="downloadPdf"[^>]*disabled=""/);
    expect(markup).not.toMatch(/data-intent="print"[^>]*disabled=""/);
  });

  it("renders states without a receipt", () => {
    const markup = render(
      <ReceiptDetailScreen
        brandName="Template"
        state={{ state: "notFound" }}
      />,
    );
    expect(markup).toContain("Receipt not found");
    expect(markup).not.toContain("<article");
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

  it("never imports the preview fixtures from production modules", () => {
    const files = sourceFiles(sourceRoot).filter(isProduction);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /from "[^"]*billing-documents-preview\.fixtures"/,
      );
    }
  });

  it("is not imported by any production module outside the feature", () => {
    for (const file of sourceFiles(sourceRoot).filter(isProduction)) {
      if (file.startsWith(featureRoot)) continue;
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /features\/billing-documents/,
      );
    }
  });

  it("makes no API call and invents no document source", () => {
    for (const file of sourceFiles(featureRoot).filter(isProduction)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/from "@template\/api-(client|react)/);
      expect(source, file).not.toMatch(
        /fetch\(|window\.(print|location|open)|router\.push|NEXT_PUBLIC_/,
      );
      expect(source, file).not.toMatch(/@\/app\/billing|@\/lib\/billing/);
    }
  });

  it("adds no production route or navigation entry", () => {
    const appDirectory = join(sourceRoot, "app");
    for (const route of [
      ["billing", "invoices"],
      ["billing", "receipts"],
      ["invoices"],
      ["receipts"],
    ]) {
      expect(() => statSync(join(appDirectory, ...route))).toThrow();
    }
    const navigation = readFileSync(
      join(sourceRoot, "config", "navigation.ts"),
      "utf8",
    );
    expect(navigation).not.toMatch(/invoice|receipt/i);
  });
});
