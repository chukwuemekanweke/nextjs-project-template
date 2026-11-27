import {
  parseAdminRangePreset,
  type AdminActionAvailability,
  type AdminMetric,
  type AdminRangePreset,
} from "@/components/admin-patterns";
import type {
  BillingDocumentParty,
  BillingDocumentProps,
  BillingDocumentTotal,
} from "@template/dashboard-ui/documents";
import { formatMinorUnits } from "@template/ui-core";
import {
  formatUtcDate,
  type StatusPresentation,
} from "../admin-billing-shared/billing-model";
import type { BillingTimelineEvent } from "../admin-billing-shared/billing-sections";

/*
 * Admin invoices view model (ADM-INVOICES, ADM-INVOICE-DETAIL; Trello
 * FE-UI-018, design `5-invoices-and-receipts`).
 *
 * Local presentation types: the backend has no invoice or receipt entity,
 * read or operation and `@template/api-client` has no contract (DR-160).
 * Customer billing history and admin payment reads are not invoices: a
 * future adapter maps an authoritative admin invoice read into these types
 * and must never derive an invoice from a purchase or payment, compute
 * taxes, totals, balances or overdue status, or invent receipt numbers. A
 * field the source does not return stays `null` and renders "Not available"
 * or is omitted, never zero.
 */

export type AdminInvoiceRow = Readonly<{
  /** Backend invoice id; detail navigation uses this id only. */
  id: string;
  invoiceNumber: string;
  customerDisplayName: string | null;
  customerEmail: string | null;
  customerId: string | null;
  planName: string | null;
  /** Raw interval (`Monthly`, `Yearly`). */
  billingInterval: string | null;
  /** Whole minor units. */
  total: number | string;
  currencyCode: string;
  /** Raw invoice status (`Paid`, `Due`, `Overdue`, `Void`, …). */
  status: string;
  issuedAtUtc: string;
  dueAtUtc: string | null;
  receiptNumber: string | null;
}>;

export type AdminInvoiceParty = Readonly<{
  name: string;
  email: string | null;
  addressLines: readonly string[];
}>;

export type AdminInvoiceLine = Readonly<{
  id: string;
  description: string;
  detail: string | null;
  quantity: number | null;
  unitAmount: number | string | null;
  amount: number | string;
}>;

export type AdminInvoiceDetail = AdminInvoiceRow &
  Readonly<{
    issuer: AdminInvoiceParty &
      Readonly<{
        registrationNumber: string | null;
        taxNumber: string | null;
      }>;
    billedTo: AdminInvoiceParty;
    periodStartUtc: string | null;
    periodEndUtc: string | null;
    lineItems: readonly AdminInvoiceLine[];
    subtotal: number | string | null;
    /** Tax, discount and fee lines with their returned labels. */
    adjustments: readonly Readonly<{
      id: string;
      label: string;
      amount: number | string;
    }>[];
    amountPaid: number | string | null;
    amountDue: number | string | null;
    payment: Readonly<{
      paidAtUtc: string;
      method: string | null;
      reference: string | null;
      /** Admin payment id, for the payment detail link. */
      paymentId: string | null;
    }> | null;
    subscriptionId: string | null;
    notes: readonly string[];
    /** `null` when the source keeps no invoice history. */
    history: readonly BillingTimelineEvent[] | null;
    /** Backend-reported availability; a handler alone never enables one. */
    actions: Readonly<{
      downloadPdf: AdminActionAvailability;
      resend: AdminActionAvailability;
    }>;
  }>;

/** Reference KPI tiles; each is unavailable until the backend reports it. */
export type AdminInvoiceSummary = Readonly<{
  collected: AdminMetric;
  invoiced: AdminMetric;
  outstanding: AdminMetric;
  overdue: AdminMetric;
}>;

export type AdminInvoiceAction =
  | Readonly<{ type: "exportCsv" }>
  | Readonly<{ invoiceId: string; type: "downloadPdf" }>
  | Readonly<{ invoiceId: string; type: "resend" }>
  | Readonly<{ type: "print" }>;

/** Why invoice screens have no data in this build (DR-160). */
export const ADMIN_INVOICES_UNAVAILABLE_REASON =
  "The backend has no invoice API yet.";

/* ------------------------------------------------------------------------ */
/* Status                                                                    */
/* ------------------------------------------------------------------------ */

const INVOICE_STATUSES: Readonly<Record<string, StatusPresentation>> = {
  Due: { label: "Due", tone: "warning" },
  Open: { label: "Due", tone: "warning" },
  Overdue: { label: "Overdue", tone: "danger" },
  Paid: { label: "Paid", tone: "success" },
  Void: { label: "Void", tone: "neutral" },
};

/**
 * Raw invoice status. Overdue comes only from the backend, never from the
 * due date; unknown values are shown as returned with a neutral tone.
 */
export function describeInvoiceStatus(status: string): StatusPresentation {
  return INVOICE_STATUSES[status] ?? { label: status, tone: "neutral" };
}

export const invoiceStatusFilterOptions = [
  { label: "Paid", value: "Paid" },
  { label: "Due", value: "Due" },
  { label: "Overdue", value: "Overdue" },
  { label: "Void", value: "Void" },
] as const;

export function invoicePlanLabel(row: AdminInvoiceRow): string | null {
  if (!row.planName) return null;
  return row.billingInterval
    ? `${row.planName} · ${row.billingInterval.toLowerCase()}`
    : row.planName;
}

/* ------------------------------------------------------------------------ */
/* Filters (URL state owned by the future page)                              */
/* ------------------------------------------------------------------------ */

export const INVOICE_SEARCH_MAX_LENGTH = 100;

export type AdminInvoiceFilters = Readonly<{
  query: string;
  range: AdminRangePreset;
  status: string;
}>;

export const DEFAULT_INVOICE_FILTERS: AdminInvoiceFilters = {
  query: "",
  range: "30d",
  status: "",
};

const FILTER_PARAMS = {
  query: "q",
  range: "range",
  status: "status",
} as const satisfies Record<keyof AdminInvoiceFilters, string>;

type SearchParamsLike = Readonly<{ get(name: string): string | null }>;

function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim().slice(0, INVOICE_SEARCH_MAX_LENGTH);
}

/** Reads filters from URL params; unknown statuses are dropped. */
export function parseInvoiceFilters(
  params: SearchParamsLike,
): AdminInvoiceFilters {
  const status = cleanText(params.get(FILTER_PARAMS.status));
  return {
    query: cleanText(params.get(FILTER_PARAMS.query)),
    range:
      parseAdminRangePreset(params.get(FILTER_PARAMS.range)) ??
      DEFAULT_INVOICE_FILTERS.range,
    status: invoiceStatusFilterOptions.some((option) => option.value === status)
      ? status
      : "",
  };
}

export function invoiceFiltersToSearchParams(
  filters: AdminInvoiceFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(
    FILTER_PARAMS,
  ) as (keyof AdminInvoiceFilters)[]) {
    const value = cleanText(filters[key]);
    if (value && value !== DEFAULT_INVOICE_FILTERS[key]) {
      params.set(FILTER_PARAMS[key], value);
    }
  }
  return params;
}

export function hasActiveInvoiceFilters(filters: AdminInvoiceFilters): boolean {
  return invoiceFiltersToSearchParams(filters).toString() !== "";
}

/* ------------------------------------------------------------------------ */
/* Document sheet                                                            */
/* ------------------------------------------------------------------------ */

const quantityFormat = new Intl.NumberFormat("en-US");

function party(label: string, source: AdminInvoiceParty): BillingDocumentParty {
  return {
    label,
    lines: [
      ...(source.email ? [source.email] : []),
      ...source.addressLines.filter((line) => line.trim() !== ""),
    ],
    name: source.name,
  };
}

/** Payment confirmation line, from returned fields only. */
export function invoicePaymentLine(
  invoice: AdminInvoiceDetail,
): string | undefined {
  const payment = invoice.payment;
  if (!payment) return undefined;
  const paidOn = formatUtcDate(payment.paidAtUtc);
  return [
    paidOn ? `Paid on ${paidOn}` : "Paid",
    payment.method,
    payment.reference ? `Ref ${payment.reference}` : null,
    invoice.receiptNumber ? `Receipt ${invoice.receiptNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function notice(
  invoice: AdminInvoiceDetail,
): BillingDocumentProps["notice"] | undefined {
  const due = formatUtcDate(invoice.dueAtUtc);
  switch (invoice.status) {
    case "Paid": {
      const line = invoicePaymentLine(invoice);
      return line ? { content: line, tone: "success" } : undefined;
    }
    case "Due":
    case "Open":
      return {
        content: due ? `Payment due by ${due}.` : "Payment due.",
        tone: "warning",
      };
    case "Overdue":
      return {
        content: due ? `Payment overdue since ${due}.` : "Payment overdue.",
        tone: "danger",
      };
    default:
      return undefined;
  }
}

/** Sheet content for an invoice; omits anything the source did not return. */
export function adminInvoiceDocumentContent(
  invoice: AdminInvoiceDetail,
): Omit<BillingDocumentProps, "brandName"> {
  const currency = invoice.currencyCode;
  const money = (amount: number | string) => formatMinorUnits(amount, currency);
  const issued = formatUtcDate(invoice.issuedAtUtc);
  const due = formatUtcDate(invoice.dueAtUtc);
  const periodStart = formatUtcDate(invoice.periodStartUtc);
  const periodEnd = formatUtcDate(invoice.periodEndUtc);
  const totals: BillingDocumentTotal[] = [
    ...(invoice.subtotal === null
      ? []
      : [{ label: "Subtotal", value: money(invoice.subtotal) }]),
    ...invoice.adjustments.map((adjustment) => ({
      id: adjustment.id,
      label: adjustment.label,
      value: money(adjustment.amount),
    })),
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
  ];
  const issuer = invoice.issuer;
  return {
    facts: [
      ...(issued ? [{ label: "Issue date", value: issued }] : []),
      ...(due ? [{ label: "Due date", value: due }] : []),
      ...(periodStart && periodEnd
        ? [{ label: "Billing period", value: `${periodStart} – ${periodEnd}` }]
        : []),
      { label: "Currency", value: currency },
    ],
    footerDetails: [
      [
        issuer.name,
        issuer.registrationNumber
          ? `Registration no. ${issuer.registrationNumber}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      [
        issuer.taxNumber ? `Tax no. ${issuer.taxNumber}` : null,
        issuer.addressLines.filter((line) => line.trim() !== "").join(", ") ||
          null,
      ]
        .filter(Boolean)
        .join(" · "),
    ].filter(Boolean),
    footerNotes: invoice.notes,
    issuerName: issuer.name,
    lineItems: invoice.lineItems.map((item) => ({
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
    lineItemsCaption: `Invoice ${invoice.invoiceNumber} line items`,
    notice: notice(invoice),
    number: invoice.invoiceNumber,
    numberLabel: "Invoice no.",
    parties: [party("Billed to", invoice.billedTo), party("From", issuer)],
    status: describeInvoiceStatus(invoice.status),
    title: "Invoice",
    totals,
  };
}
