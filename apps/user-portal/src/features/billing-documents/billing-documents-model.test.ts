import { describe, expect, it } from "vitest";
import {
  describeInvoiceStatus,
  describeReceiptStatus,
  formatDocumentDate,
  formatDocumentDateTime,
  invoiceDocumentContent,
  invoicePageDescription,
  receiptDocumentContent,
} from "./billing-documents-model";
import {
  fixtureDueInvoice,
  fixtureInvoice,
  fixtureOverdueInvoice,
  fixturePaidInvoice,
  fixtureSubscriptionReceipt,
  fixtureWalletReceipt,
} from "./billing-documents-preview.fixtures";

/** Intl currency output uses a no-break space; compare plain text. */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replace(/ /g, " ")) as T;
}

describe("statuses", () => {
  it("maps known invoice statuses to variants", () => {
    expect(describeInvoiceStatus("Paid")).toEqual({
      label: "Paid",
      tone: "success",
      variant: "paid",
    });
    expect(describeInvoiceStatus("Open").variant).toBe("due");
    expect(describeInvoiceStatus("Overdue").tone).toBe("danger");
    expect(describeReceiptStatus("Paid").tone).toBe("success");
  });

  it.each([
    "constructor",
    "toString",
    "__proto__",
    "hasOwnProperty",
    "Pending",
  ])(
    "shows unknown status %s as returned, never as an inherited property",
    (status) => {
      expect(describeInvoiceStatus(status)).toEqual({
        label: status,
        tone: "neutral",
        variant: "other",
      });
      expect(describeReceiptStatus(status)).toEqual({
        label: status,
        tone: "neutral",
      });
    },
  );

  it("never derives overdue from a past due date", () => {
    const content = invoiceDocumentContent(
      fixtureInvoice({ dueAtUtc: "2000-01-01T00:00:00Z", status: "Due" }),
    );
    expect(content.status?.label).toBe("Due");
    expect(content.notice?.tone).toBe("warning");
  });
});

describe("dates", () => {
  it("formats UTC dates and times and rejects invalid input", () => {
    expect(formatDocumentDate("2026-01-14T23:30:00Z")).toBe("14 Jan 2026");
    expect(formatDocumentDateTime("2026-01-14T10:01:00Z")).toBe(
      "14 Jan 2026 · 10:01 UTC",
    );
    expect(formatDocumentDate(null)).toBeUndefined();
    expect(formatDocumentDate("not a date")).toBeUndefined();
  });
});

describe("invoiceDocumentContent", () => {
  it("formats minor units in the invoice currency", () => {
    const content = plain(invoiceDocumentContent(fixtureDueInvoice));
    expect(content.lineItems[0]).toMatchObject({
      amount: "NGN 13,953.49",
      quantity: "1",
      unitPrice: "NGN 13,953.49",
    });
    expect(content.totals?.map(({ label, value }) => [label, value])).toEqual([
      ["Subtotal", "NGN 13,953.49"],
      ["VAT (7.5%)", "NGN 1,046.51"],
      ["Total", "NGN 15,000.00"],
      ["Amount due", "NGN 15,000.00"],
    ]);
  });

  it("omits values that were not supplied", () => {
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
    expect(content.notice?.content).toBe("Payment due.");
    expect(
      invoicePageDescription(
        fixtureInvoice({ lineItems: [], periodEndUtc: null }),
      ),
    ).toBeUndefined();
  });

  it("states due, overdue and paid notices", () => {
    expect(invoiceDocumentContent(fixtureDueInvoice).notice?.content).toBe(
      "Payment due by 21 Jan 2026.",
    );
    expect(invoiceDocumentContent(fixtureOverdueInvoice).notice?.content).toBe(
      "Payment overdue since 21 Jan 2026.",
    );
    expect(invoiceDocumentContent(fixturePaidInvoice).notice).toEqual({
      content:
        "Paid on 14 Jan 2026 · Fixture Provider · card · Ref FIXPAY-8812 · Receipt FIX-RCT-0331",
      tone: "success",
    });
    expect(
      invoiceDocumentContent(fixtureInvoice({ status: "Void" })).notice,
    ).toBeUndefined();
  });
});

describe("receiptDocumentContent", () => {
  it("shows amount, paid time, method and reference", () => {
    const content = plain(receiptDocumentContent(fixtureSubscriptionReceipt));
    expect(content.highlight).toEqual({
      detail: "Paid on 14 Jan 2026 · 10:01 UTC",
      label: "Amount paid",
      value: "NGN 15,000.00",
    });
    expect(content.facts).toEqual([
      { label: "Payment method", value: "Fixture Provider · card" },
      { label: "Payment reference", mono: true, value: "FIXPAY-8812" },
      { label: "Currency", value: "NGN" },
    ]);
    expect(content.totals?.at(-1)).toEqual({
      emphasis: "total",
      label: "Total paid",
      value: "NGN 15,000.00",
    });
  });

  it("renders wallet receipts from the same model and omits missing facts", () => {
    const content = plain(
      receiptDocumentContent({
        ...fixtureWalletReceipt,
        paymentMethod: null,
        paymentReference: null,
      }),
    );
    expect(content.lineItems[0]?.description).toBe("Wallet top-up");
    expect(content.totals?.map(({ label }) => label)).toEqual([
      "Subtotal",
      "Fees",
      "Total paid",
    ]);
    expect(content.facts?.map(({ label }) => label)).toEqual(["Currency"]);
  });
});
