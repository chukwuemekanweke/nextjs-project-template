import { describe, expect, it } from "vitest";
import {
  describeInvoiceStatus,
  describeReceiptStatus,
  formatDocumentDate,
  formatDocumentDateTime,
  formatDocumentPeriod,
  invoiceDocumentContent,
  invoicePageDescription,
  invoicePaymentLine,
  issuerFooterLines,
  receiptDocumentContent,
} from "./billing-documents-model";
import {
  fixtureDueInvoice,
  fixtureInvoice,
  fixtureIssuer,
  fixtureOverdueInvoice,
  fixturePaidInvoice,
  fixtureSubscriptionReceipt,
  fixtureWalletReceipt,
} from "./billing-documents-preview.fixtures";

/** Intl currency output uses a no-break space; compare plain text. */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replace(/ /g, " ")) as T;
}

describe("invoice status", () => {
  it("derives the variant from the backend status only", () => {
    expect(describeInvoiceStatus("Paid")).toEqual({
      label: "Paid",
      tone: "success",
      variant: "paid",
    });
    expect(describeInvoiceStatus("Due").variant).toBe("due");
    expect(describeInvoiceStatus("Open").label).toBe("Due");
    expect(describeInvoiceStatus("Overdue")).toEqual({
      label: "Overdue",
      tone: "danger",
      variant: "overdue",
    });
  });

  it("never reads an unknown status as paid or overdue", () => {
    expect(describeInvoiceStatus("ProviderReview")).toEqual({
      label: "ProviderReview",
      tone: "neutral",
      variant: "other",
    });
    expect(describeReceiptStatus("Pending")).toEqual({
      label: "Pending",
      tone: "neutral",
    });
  });

  it("does not compute overdue from a past due date", () => {
    const content = invoiceDocumentContent(
      fixtureInvoice({ dueAtUtc: "2000-01-01T00:00:00Z", status: "Due" }),
    );
    expect(content.status?.label).toBe("Due");
    expect(content.notice?.tone).toBe("warning");
  });
});

describe("document dates", () => {
  it("formats UTC dates and times, never substituting now", () => {
    expect(formatDocumentDate("2026-01-14T23:30:00Z")).toBe("14 Jan 2026");
    expect(formatDocumentDateTime("2026-01-14T10:01:00Z")).toBe(
      "14 Jan 2026 · 10:01 UTC",
    );
    expect(formatDocumentDate(null)).toBeUndefined();
    expect(formatDocumentDate("not a date")).toBeUndefined();
    expect(formatDocumentPeriod("2026-01-14T00:00:00Z", null)).toBeUndefined();
  });
});

describe("invoiceDocumentContent", () => {
  it("formats backend minor units in the invoice currency", () => {
    const content = invoiceDocumentContent(fixtureDueInvoice);
    expect(plain(content.lineItems[0])).toMatchObject({
      amount: "NGN 13,953.49",
      quantity: "1",
      unitPrice: "NGN 13,953.49",
    });
    expect(
      plain(content.totals?.map(({ label, value }) => [label, value])),
    ).toEqual([
      ["Subtotal", "NGN 13,953.49"],
      ["VAT (7.5%)", "NGN 1,046.51"],
      ["Total", "NGN 15,000.00"],
      ["Amount due", "NGN 15,000.00"],
    ]);
  });

  it("omits totals, facts and columns the source did not return", () => {
    const content = invoiceDocumentContent(
      fixtureInvoice({
        adjustments: [],
        amountDue: null,
        dueAtUtc: null,
        lineItems: [
          {
            amount: 500,
            description: "Line",
            detail: null,
            id: "l",
            quantity: null,
            unitAmount: null,
          },
        ],
        periodEndUtc: null,
        subtotal: null,
      }),
    );
    expect(content.totals?.map(({ label }) => label)).toEqual(["Total"]);
    expect(content.facts?.map(({ label }) => label)).toEqual([
      "Issue date",
      "Currency",
    ]);
    expect(content.lineItems[0]?.quantity).toBeUndefined();
    expect(content.lineItems[0]?.unitPrice).toBeUndefined();
    expect(content.notice?.content).toBe("Payment due.");
  });

  it("states due, overdue and paid notices from returned fields only", () => {
    expect(invoiceDocumentContent(fixtureDueInvoice).notice).toEqual({
      content: "Payment due by 21 Jan 2026.",
      tone: "warning",
    });
    expect(invoiceDocumentContent(fixtureOverdueInvoice).notice).toEqual({
      content: "Payment overdue since 21 Jan 2026.",
      tone: "danger",
    });
    expect(invoiceDocumentContent(fixturePaidInvoice).notice).toEqual({
      content:
        "Paid on 14 Jan 2026 · Fixture Provider · card · Ref FIXPAY-8812 · Receipt FIX-RCT-0331",
      tone: "success",
    });
    expect(
      invoicePaymentLine(
        fixtureInvoice({
          payment: {
            method: null,
            paidAtUtc: "2026-01-14T10:01:00Z",
            receiptId: null,
            receiptNumber: null,
            reference: null,
          },
          status: "Paid",
        }),
      ),
    ).toBe("Paid on 14 Jan 2026");
    expect(
      invoiceDocumentContent(fixtureInvoice({ status: "Void" })).notice,
    ).toBeUndefined();
  });

  it("uses issuer and recipient exactly as returned", () => {
    const content = invoiceDocumentContent(fixtureDueInvoice);
    expect(content.parties).toEqual([
      {
        label: "Billed to",
        lines: ["customer@fixture.invalid", "Fixture City, Fixtureland"],
        name: "Fixture Customer",
      },
      {
        label: "From",
        lines: ["1 Fixture Street", "Fixture City, Fixtureland"],
        name: "Fixture Issuer Ltd",
      },
    ]);
    expect(issuerFooterLines(fixtureIssuer)).toEqual([
      "Fixture Issuer Ltd · Registration no. FIX-RC-0001",
      "Tax no. FIX-TAX-0001 · 1 Fixture Street, Fixture City, Fixtureland",
    ]);
    expect(
      issuerFooterLines({
        ...fixtureIssuer,
        addressLines: [],
        registrationNumber: null,
        taxNumber: null,
      }),
    ).toEqual(["Fixture Issuer Ltd"]);
  });

  it("describes the page from a single line item and the period", () => {
    expect(invoicePageDescription(fixtureDueInvoice)).toBe(
      "Fixture Standard plan · 14 Jan 2026 – 14 Feb 2026",
    );
    expect(
      invoicePageDescription(
        fixtureInvoice({ periodEndUtc: null, lineItems: [] }),
      ),
    ).toBeUndefined();
  });
});

describe("receiptDocumentContent", () => {
  it("shows the amount paid, paid time, method and reference", () => {
    const content = receiptDocumentContent(fixtureSubscriptionReceipt);
    expect(plain(content.highlight)).toEqual({
      detail: "Paid on 14 Jan 2026 · 10:01 UTC",
      label: "Amount paid",
      value: "NGN 15,000.00",
    });
    expect(content.facts).toEqual([
      { label: "Payment method", value: "Fixture Provider · card" },
      { label: "Payment reference", mono: true, value: "FIXPAY-8812" },
      { label: "Currency", value: "NGN" },
    ]);
    expect(content.parties?.map(({ label }) => label)).toEqual([
      "Received from",
      "Paid to",
    ]);
    expect(plain(content.totals?.at(-1))).toEqual({
      emphasis: "total",
      label: "Total paid",
      value: "NGN 15,000.00",
    });
  });

  it("renders wallet receipts from the same model", () => {
    const content = receiptDocumentContent(fixtureWalletReceipt);
    expect(content.number).toBe("FIX-RCT-0352");
    expect(content.lineItems[0]?.description).toBe("Wallet top-up");
    expect(
      plain(content.totals?.map(({ label, value }) => [label, value])),
    ).toEqual([
      ["Subtotal", "NGN 20,000.00"],
      ["Fees", "NGN 0.00"],
      ["Total paid", "NGN 20,000.00"],
    ]);
  });

  it("omits missing method and reference instead of inventing them", () => {
    const content = receiptDocumentContent({
      ...fixtureWalletReceipt,
      paymentMethod: null,
      paymentReference: null,
    });
    expect(content.facts?.map(({ label }) => label)).toEqual(["Currency"]);
  });
});
