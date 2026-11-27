import type {
  BillingDocumentParty,
  BillingDocumentProps,
  BillingDocumentTotal,
} from "@template/dashboard-ui/documents";
import { formatMinorUnits, type BadgeTone } from "@template/ui-core";

/*
 * Invoice and receipt presentation for USR-INVOICE-DETAIL and
 * USR-RECEIPT-DETAIL (Trello FE-UI-018, design `5-invoices-and-receipts`).
 *
 * PREVIEW-ONLY: the backend has no invoice or receipt capability yet
 * (BE-DS-007, DR-160), so these are local presentation types describing what
 * the reference screens show, not a backend contract. Nothing in production
 * builds them. Amounts are whole minor units formatted with
 * `formatMinorUnits`; statuses, totals and dates are shown as given and never
 * computed (overdue is never derived from the clock).
 */

/** Whole minor units. */
type Money = number | string;

export type DocumentParty = Readonly<{
  name: string;
  email: string | null;
  addressLines: readonly string[];
}>;

export type DocumentLineItem = Readonly<{
  id: string;
  description: string;
  detail: string | null;
  quantity: number | null;
  unitAmount: Money | null;
  amount: Money;
}>;

/** A labelled tax, discount or fee line. */
export type DocumentAdjustment = Readonly<{
  id: string;
  label: string;
  amount: Money;
}>;

type DocumentBase = Readonly<{
  /** Document identifier; navigation uses this id only. */
  id: string;
  /** Raw status. */
  status: string;
  currencyCode: string;
  issuer: DocumentParty;
  /** Issuer legal lines for the footer (registration, tax, address). */
  issuerLegalLines: readonly string[];
  lineItems: readonly DocumentLineItem[];
  subtotal: Money | null;
  adjustments: readonly DocumentAdjustment[];
  notes: readonly string[];
}>;

export type UserInvoice = DocumentBase &
  Readonly<{
    invoiceNumber: string;
    issuedAtUtc: string;
    dueAtUtc: string | null;
    periodStartUtc: string | null;
    periodEndUtc: string | null;
    billedTo: DocumentParty;
    total: Money;
    amountPaid: Money | null;
    amountDue: Money | null;
    payment: Readonly<{
      paidAtUtc: string;
      method: string | null;
      reference: string | null;
      receiptId: string | null;
      receiptNumber: string | null;
    }> | null;
  }>;

export type UserReceipt = DocumentBase &
  Readonly<{
    receiptNumber: string;
    kind: "subscription" | "wallet";
    payer: DocumentParty;
    paidAtUtc: string;
    amountPaid: Money;
    totalPaid: Money;
    paymentMethod: string | null;
    paymentReference: string | null;
    /** The invoice a subscription receipt settles. */
    invoice: Readonly<{ id: string | null; invoiceNumber: string }> | null;
    /** The wallet transaction reference of a wallet receipt. */
    walletReference: string | null;
  }>;

/** Read state of one owner-scoped document. */
export type DocumentReadState<Document> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error" }>
  /** Missing or not the caller's document; never says which. */
  | Readonly<{ state: "notFound" }>
  | Readonly<{ state: "unavailable" }>
  | Readonly<{ state: "ready"; document: Document }>;

/* ------------------------------------------------------------------------ */
/* Statuses                                                                  */
/* ------------------------------------------------------------------------ */

export type InvoiceVariant = "paid" | "due" | "overdue" | "other";

export type DocumentStatus = Readonly<{ label: string; tone: BadgeTone }>;

/** Invoice status and variant; unknown values are shown as returned. */
export function describeInvoiceStatus(
  status: string,
): DocumentStatus & Readonly<{ variant: InvoiceVariant }> {
  switch (status) {
    case "Paid":
      return { label: "Paid", tone: "success", variant: "paid" };
    case "Due":
    case "Open":
      return { label: "Due", tone: "warning", variant: "due" };
    case "Overdue":
      return { label: "Overdue", tone: "danger", variant: "overdue" };
    case "Void":
      return { label: "Void", tone: "neutral", variant: "other" };
    default:
      return { label: status, tone: "neutral", variant: "other" };
  }
}

/** Receipt status; unknown values are shown as returned. */
export function describeReceiptStatus(status: string): DocumentStatus {
  switch (status) {
    case "Paid":
      return { label: "Paid", tone: "success" };
    case "Refunded":
      return { label: "Refunded", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

/* ------------------------------------------------------------------------ */
/* Dates (UTC, so a document reads the same for every viewer and in print)   */
/* ------------------------------------------------------------------------ */

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: "UTC",
});

function timestamp(value: string | null | undefined): number | undefined {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** "14 Nov 2026" (UTC), or `undefined` for a missing or invalid value. */
export function formatDocumentDate(
  value: string | null | undefined,
): string | undefined {
  const at = timestamp(value);
  return at === undefined ? undefined : dateFormat.format(at);
}

/** "14 Nov 2026 · 10:01 UTC", or `undefined`. */
export function formatDocumentDateTime(
  value: string | null | undefined,
): string | undefined {
  const at = timestamp(value);
  return at === undefined
    ? undefined
    : `${dateFormat.format(at)} · ${timeFormat.format(at)} UTC`;
}

function formatPeriod(
  start: string | null,
  end: string | null,
): string | undefined {
  const from = formatDocumentDate(start);
  const to = formatDocumentDate(end);
  return from && to ? `${from} – ${to}` : undefined;
}

/* ------------------------------------------------------------------------ */
/* Document sheet content                                                    */
/* ------------------------------------------------------------------------ */

const quantityFormat = new Intl.NumberFormat("en-US");

type SheetContent = Omit<BillingDocumentProps, "brandName">;

function party(label: string, source: DocumentParty): BillingDocumentParty {
  return {
    label,
    lines: [...(source.email ? [source.email] : []), ...source.addressLines],
    name: source.name,
  };
}

/** Line items, subtotal and adjustments shared by both documents. */
function commonContent(document: DocumentBase) {
  const money = (amount: Money) =>
    formatMinorUnits(amount, document.currencyCode);
  const subtotal: BillingDocumentTotal[] =
    document.subtotal === null
      ? []
      : [{ label: "Subtotal", value: money(document.subtotal) }];
  return {
    adjustments: [
      ...subtotal,
      ...document.adjustments.map((adjustment) => ({
        id: adjustment.id,
        label: adjustment.label,
        value: money(adjustment.amount),
      })),
    ],
    footerDetails: document.issuerLegalLines,
    footerNotes: document.notes,
    issuerName: document.issuer.name,
    lineItems: document.lineItems.map((item) => ({
      amount: money(item.amount),
      description: item.description,
      detail: item.detail ?? undefined,
      id: item.id,
      quantity:
        item.quantity === null
          ? undefined
          : quantityFormat.format(item.quantity),
      unitPrice: item.unitAmount === null ? undefined : money(item.unitAmount),
    })),
    money,
  };
}

/** Payment line of a paid invoice, from the recorded payment only. */
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

function invoiceNotice(invoice: UserInvoice): SheetContent["notice"] {
  const due = formatDocumentDate(invoice.dueAtUtc);
  switch (describeInvoiceStatus(invoice.status).variant) {
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

export function invoiceDocumentContent(invoice: UserInvoice): SheetContent {
  const { adjustments, money, ...common } = commonContent(invoice);
  const issued = formatDocumentDate(invoice.issuedAtUtc);
  const due = formatDocumentDate(invoice.dueAtUtc);
  const period = formatPeriod(invoice.periodStartUtc, invoice.periodEndUtc);
  return {
    ...common,
    facts: [
      ...(issued ? [{ label: "Issue date", value: issued }] : []),
      ...(due ? [{ label: "Due date", value: due }] : []),
      ...(period ? [{ label: "Billing period", value: period }] : []),
      { label: "Currency", value: invoice.currencyCode },
    ],
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
    totals: [
      ...adjustments,
      { emphasis: "total", label: "Total", value: money(invoice.total) },
      ...(invoice.amountPaid === null
        ? []
        : [{ label: "Amount paid", value: money(invoice.amountPaid) }]),
      ...(invoice.amountDue === null
        ? []
        : [
            {
              emphasis: "balance" as const,
              label: "Amount due",
              value: money(invoice.amountDue),
            },
          ]),
    ],
  };
}

export function receiptDocumentContent(receipt: UserReceipt): SheetContent {
  const { adjustments, money, ...common } = commonContent(receipt);
  const paidAt = formatDocumentDateTime(receipt.paidAtUtc);
  return {
    ...common,
    facts: [
      ...(receipt.paymentMethod
        ? [{ label: "Payment method", value: receipt.paymentMethod }]
        : []),
      ...(receipt.paymentReference
        ? [
            {
              label: "Payment reference",
              mono: true,
              value: receipt.paymentReference,
            },
          ]
        : []),
      { label: "Currency", value: receipt.currencyCode },
    ],
    highlight: {
      detail: paidAt ? `Paid on ${paidAt}` : undefined,
      label: "Amount paid",
      value: money(receipt.amountPaid),
    },
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
      ...adjustments,
      {
        emphasis: "total",
        label: "Total paid",
        value: money(receipt.totalPaid),
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
    formatPeriod(invoice.periodStartUtc, invoice.periodEndUtc),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}
