import type {
  BillingDocumentFact,
  BillingDocumentParty,
  BillingDocumentProps,
  BillingDocumentTotal,
} from "@template/dashboard-ui/documents";
import { formatMinorUnits, type BadgeTone } from "@template/ui-core";

/*
 * Invoice and receipt view models for USR-INVOICE-DETAIL and
 * USR-RECEIPT-DETAIL (Trello FE-UI-018, design `5-invoices-and-receipts`).
 *
 * There is no invoice or receipt contract in the backend or in
 * `@template/api-client` (DR-160): the billing history rows and purchase
 * status carry no invoice/receipt identifiers, and no operation lists, reads,
 * renders, emails or pays a document. These are local presentation types.
 * Nothing in production builds them yet. A future adapter maps an
 * authoritative owner-scoped document read into them; it must not derive a
 * document from a purchase, payment or wallet top-up (a successful payment
 * is not proof that a receipt was issued), and must never compute amounts,
 * taxes, totals, due dates or statuses. Fields the source does not return
 * stay `null` and are omitted from the document.
 *
 * Amounts are whole minor units in the document currency and are formatted
 * only with `formatMinorUnits`.
 */

/** Whole minor units, as returned. */
export type DocumentMoney = number | string;

export type DocumentParty = Readonly<{
  name: string;
  email: string | null;
  /** Postal address lines exactly as returned. */
  addressLines: readonly string[];
}>;

/** The legal issuer, as returned by the backend (never app configuration). */
export type DocumentIssuer = DocumentParty &
  Readonly<{
    registrationNumber: string | null;
    taxNumber: string | null;
  }>;

export type DocumentLineItem = Readonly<{
  id: string;
  description: string;
  detail: string | null;
  quantity: number | null;
  unitAmount: DocumentMoney | null;
  amount: DocumentMoney;
}>;

/** A labelled tax, discount or fee line, label and amount as returned. */
export type DocumentAdjustment = Readonly<{
  id: string;
  label: string;
  amount: DocumentMoney;
}>;

/**
 * Operations the backend reports as available for this document. A handler
 * alone never enables an action.
 */
export type DocumentCapabilities = Readonly<{
  downloadPdf: boolean;
  emailCopy: boolean;
}>;

export type InvoicePayment = Readonly<{
  paidAtUtc: string;
  /** Method summary as returned, for example "Bachs · card". */
  method: string | null;
  reference: string | null;
  /** Receipt identifier; navigation uses this id only. */
  receiptId: string | null;
  receiptNumber: string | null;
}>;

export type UserInvoice = Readonly<{
  /** Backend invoice identifier; navigation uses this id only. */
  id: string;
  invoiceNumber: string;
  /** Raw backend status (`Paid`, `Due`, `Overdue`, `Void`, …). */
  status: string;
  currencyCode: string;
  issuedAtUtc: string;
  dueAtUtc: string | null;
  periodStartUtc: string | null;
  periodEndUtc: string | null;
  issuer: DocumentIssuer;
  billedTo: DocumentParty;
  lineItems: readonly DocumentLineItem[];
  subtotal: DocumentMoney | null;
  adjustments: readonly DocumentAdjustment[];
  total: DocumentMoney;
  amountPaid: DocumentMoney | null;
  amountDue: DocumentMoney | null;
  payment: InvoicePayment | null;
  /** Document notes as returned (terms, tax statements). */
  notes: readonly string[];
  capabilities: DocumentCapabilities &
    Readonly<{
      /** Online payment of this invoice through a supported integration. */
      pay: boolean;
    }>;
}>;

export type ReceiptKind = "subscription" | "wallet";

export type UserReceipt = Readonly<{
  /** Backend receipt identifier. */
  id: string;
  receiptNumber: string;
  /** Raw backend status (`Paid`, `Refunded`, …). */
  status: string;
  kind: ReceiptKind;
  currencyCode: string;
  amountPaid: DocumentMoney;
  paidAtUtc: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  issuer: DocumentIssuer;
  payer: DocumentParty;
  lineItems: readonly DocumentLineItem[];
  subtotal: DocumentMoney | null;
  adjustments: readonly DocumentAdjustment[];
  totalPaid: DocumentMoney;
  /** The invoice this receipt settles (subscription receipts). */
  invoice: Readonly<{ id: string | null; invoiceNumber: string }> | null;
  /** The wallet transaction this receipt covers (wallet receipts). */
  walletTransaction: Readonly<{ reference: string | null }> | null;
  notes: readonly string[];
  capabilities: DocumentCapabilities;
}>;

/** Read state of one owner-scoped document. */
export type DocumentReadState<Document> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  /** Missing or not the caller's document; never says which. */
  | Readonly<{ state: "notFound" }>
  /** No source for documents in this build. */
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "ready"; document: Document }>;

/** Why document screens have no data in this build (DR-160). */
export const BILLING_DOCUMENTS_UNAVAILABLE_REASON =
  "Invoices and receipts are not available yet.";

/**
 * Presentation intents. The screen reports what the user chose; printing,
 * downloading, emailing and paying are the caller's job.
 */
export type BillingDocumentAction =
  | Readonly<{ type: "print" }>
  | Readonly<{ documentId: string; type: "downloadPdf" }>
  | Readonly<{ documentId: string; type: "emailCopy" }>
  | Readonly<{ invoiceId: string; type: "pay" }>
  | Readonly<{ type: "retry" }>;

/* ------------------------------------------------------------------------ */
/* Statuses                                                                  */
/* ------------------------------------------------------------------------ */

export type InvoiceVariant = "paid" | "due" | "overdue" | "other";

export type DocumentStatusPresentation = Readonly<{
  label: string;
  tone: BadgeTone;
}>;

const INVOICE_STATUSES: Readonly<
  Record<string, DocumentStatusPresentation & { variant: InvoiceVariant }>
> = {
  Due: { label: "Due", tone: "warning", variant: "due" },
  Open: { label: "Due", tone: "warning", variant: "due" },
  Overdue: { label: "Overdue", tone: "danger", variant: "overdue" },
  Paid: { label: "Paid", tone: "success", variant: "paid" },
  Void: { label: "Void", tone: "neutral", variant: "other" },
};

/**
 * Invoice status from the backend value only. Overdue is never computed
 * from the due date and the clock; unknown values are shown as returned.
 */
export function describeInvoiceStatus(
  status: string,
): DocumentStatusPresentation & { variant: InvoiceVariant } {
  return (
    INVOICE_STATUSES[status] ?? {
      label: status,
      tone: "neutral",
      variant: "other",
    }
  );
}

const RECEIPT_STATUSES: Readonly<Record<string, DocumentStatusPresentation>> = {
  Paid: { label: "Paid", tone: "success" },
  Refunded: { label: "Refunded", tone: "neutral" },
};

export function describeReceiptStatus(
  status: string,
): DocumentStatusPresentation {
  return RECEIPT_STATUSES[status] ?? { label: status, tone: "neutral" };
}

/* ------------------------------------------------------------------------ */
/* Dates (UTC, so a document reads the same for every viewer and in print)   */
/* ------------------------------------------------------------------------ */

const documentDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const documentTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: "UTC",
});

function timestamp(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** "14 Nov 2026" (UTC), or `undefined` for a missing or invalid value. */
export function formatDocumentDate(
  value: string | null | undefined,
): string | undefined {
  const at = timestamp(value);
  return at === undefined ? undefined : documentDate.format(at);
}

/** "14 Nov 2026 · 10:01 UTC", or `undefined`. */
export function formatDocumentDateTime(
  value: string | null | undefined,
): string | undefined {
  const at = timestamp(value);
  return at === undefined
    ? undefined
    : `${documentDate.format(at)} · ${documentTime.format(at)} UTC`;
}

/** "14 Nov 2026 – 14 Dec 2026" from both backend boundaries, or `undefined`. */
export function formatDocumentPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
): string | undefined {
  const from = formatDocumentDate(start);
  const to = formatDocumentDate(end);
  return from && to ? `${from} – ${to}` : undefined;
}

/* ------------------------------------------------------------------------ */
/* Document sheet content                                                    */
/* ------------------------------------------------------------------------ */

const quantityFormat = new Intl.NumberFormat("en-US");

function money(amount: DocumentMoney, currencyCode: string): string {
  return formatMinorUnits(amount, currencyCode);
}

function party(label: string, source: DocumentParty): BillingDocumentParty {
  return {
    label,
    lines: [
      ...(source.email ? [source.email] : []),
      ...source.addressLines.filter((line) => line.trim() !== ""),
    ],
    name: source.name,
  };
}

/** Issuer legal lines for the footer, only from returned fields. */
export function issuerFooterLines(issuer: DocumentIssuer): string[] {
  const identity = [
    issuer.name,
    issuer.registrationNumber
      ? `Registration no. ${issuer.registrationNumber}`
      : undefined,
  ].filter(Boolean);
  const tax = [
    issuer.taxNumber ? `Tax no. ${issuer.taxNumber}` : undefined,
    issuer.addressLines.filter((line) => line.trim() !== "").join(", ") ||
      undefined,
  ].filter(Boolean);
  return [identity.join(" · "), tax.join(" · ")].filter(Boolean);
}

function lineItems(items: readonly DocumentLineItem[], currencyCode: string) {
  return items.map((item) => ({
    amount: money(item.amount, currencyCode),
    description: item.description,
    detail: item.detail ?? undefined,
    id: item.id,
    quantity:
      item.quantity === null ? undefined : quantityFormat.format(item.quantity),
    unitPrice:
      item.unitAmount === null
        ? undefined
        : money(item.unitAmount, currencyCode),
  }));
}

function adjustmentTotals(
  adjustments: readonly DocumentAdjustment[],
  currencyCode: string,
): BillingDocumentTotal[] {
  return adjustments.map((adjustment) => ({
    id: adjustment.id,
    label: adjustment.label,
    value: money(adjustment.amount, currencyCode),
  }));
}

function fact(label: string, value: string | undefined): BillingDocumentFact[] {
  return value ? [{ label, value }] : [];
}

/** Payment confirmation line for a paid invoice, from returned fields. */
export function invoicePaymentLine(invoice: UserInvoice): string | undefined {
  const payment = invoice.payment;
  if (!payment) return undefined;
  const paidOn = formatDocumentDate(payment.paidAtUtc);
  return [
    paidOn ? `Paid on ${paidOn}` : "Paid",
    payment.method,
    payment.reference ? `Ref ${payment.reference}` : null,
    payment.receiptNumber ? `Receipt ${payment.receiptNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function invoiceNotice(
  invoice: UserInvoice,
): BillingDocumentProps["notice"] | undefined {
  const { variant } = describeInvoiceStatus(invoice.status);
  const due = formatDocumentDate(invoice.dueAtUtc);
  switch (variant) {
    case "paid": {
      const line = invoicePaymentLine(invoice);
      return line ? { content: line, tone: "success" } : undefined;
    }
    case "due":
      return {
        content: due ? `Payment due by ${due}.` : "Payment due.",
        tone: "warning",
      };
    case "overdue":
      return {
        content: due ? `Payment overdue since ${due}.` : "Payment overdue.",
        tone: "danger",
      };
    case "other":
      return undefined;
  }
}

/** Sheet content for an invoice; omits anything the source did not return. */
export function invoiceDocumentContent(
  invoice: UserInvoice,
): Omit<BillingDocumentProps, "brandName"> {
  const currency = invoice.currencyCode;
  const totals: BillingDocumentTotal[] = [
    ...(invoice.subtotal === null
      ? []
      : [{ label: "Subtotal", value: money(invoice.subtotal, currency) }]),
    ...adjustmentTotals(invoice.adjustments, currency),
    {
      emphasis: "total",
      label: "Total",
      value: money(invoice.total, currency),
    },
    ...(invoice.amountPaid === null
      ? []
      : [{ label: "Amount paid", value: money(invoice.amountPaid, currency) }]),
    ...(invoice.amountDue === null
      ? []
      : [
          {
            emphasis: "balance" as const,
            label: "Amount due",
            value: money(invoice.amountDue, currency),
          },
        ]),
  ];
  return {
    facts: [
      ...fact("Issue date", formatDocumentDate(invoice.issuedAtUtc)),
      ...fact("Due date", formatDocumentDate(invoice.dueAtUtc)),
      ...fact(
        "Billing period",
        formatDocumentPeriod(invoice.periodStartUtc, invoice.periodEndUtc),
      ),
      { label: "Currency", value: currency },
    ],
    footerDetails: issuerFooterLines(invoice.issuer),
    footerNotes: invoice.notes,
    issuerName: invoice.issuer.name,
    lineItems: lineItems(invoice.lineItems, currency),
    lineItemsCaption: `Invoice ${invoice.invoiceNumber} line items`,
    notice: invoiceNotice(invoice),
    number: invoice.invoiceNumber,
    numberLabel: "Invoice no.",
    parties: [
      party("Billed to", invoice.billedTo),
      party("From", invoice.issuer),
    ],
    status: describeInvoiceStatus(invoice.status),
    title: "Invoice",
    totals,
  };
}

/** Sheet content for a receipt; omits anything the source did not return. */
export function receiptDocumentContent(
  receipt: UserReceipt,
): Omit<BillingDocumentProps, "brandName"> {
  const currency = receipt.currencyCode;
  return {
    facts: [
      ...fact("Payment method", receipt.paymentMethod ?? undefined),
      ...(receipt.paymentReference
        ? [
            {
              label: "Payment reference",
              mono: true,
              value: receipt.paymentReference,
            },
          ]
        : []),
      { label: "Currency", value: currency },
    ],
    footerDetails: issuerFooterLines(receipt.issuer),
    footerNotes: receipt.notes,
    highlight: {
      detail: formatDocumentDateTime(receipt.paidAtUtc)
        ? `Paid on ${formatDocumentDateTime(receipt.paidAtUtc)}`
        : undefined,
      label: "Amount paid",
      value: money(receipt.amountPaid, currency),
    },
    issuerName: receipt.issuer.name,
    lineItems: lineItems(receipt.lineItems, currency),
    lineItemsCaption: `Receipt ${receipt.receiptNumber} line items`,
    number: receipt.receiptNumber,
    numberLabel: "Receipt no.",
    parties: [
      party("Received from", receipt.payer),
      party("Paid to", receipt.issuer),
    ],
    status: describeReceiptStatus(receipt.status),
    title: "Receipt",
    totals: [
      ...(receipt.subtotal === null
        ? []
        : [{ label: "Subtotal", value: money(receipt.subtotal, currency) }]),
      ...adjustmentTotals(receipt.adjustments, currency),
      {
        emphasis: "total",
        label: "Total paid",
        value: money(receipt.totalPaid, currency),
      },
    ],
  };
}

/** Page subtitle: the single line item's description and the period. */
export function invoicePageDescription(
  invoice: UserInvoice,
): string | undefined {
  const parts = [
    invoice.lineItems.length === 1 ? invoice.lineItems[0]!.description : null,
    formatDocumentPeriod(invoice.periodStartUtc, invoice.periodEndUtc),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}
