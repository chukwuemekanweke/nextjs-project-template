import type { AdminMetric } from "@/components/admin-patterns";
import type {
  BillingDocumentParty,
  BillingDocumentProps,
} from "@template/dashboard-ui/documents";
import { formatMinorUnits } from "@template/ui-core";
import {
  formatUtcDate,
  type StatusPresentation,
} from "../admin-billing-shared/billing-model";
import type { BillingTimelineEvent } from "../admin-billing-shared/billing-sections";

/*
 * Admin invoices presentation (ADM-INVOICES, ADM-INVOICE-DETAIL; Trello
 * FE-UI-018, design `5-invoices-and-receipts`).
 *
 * PREVIEW-ONLY: the backend has no invoice or receipt capability yet
 * (BE-DS-007, DR-160), so these local types describe what the reference
 * screens show, not a backend contract. Amounts are whole minor units;
 * statuses, totals and dates are shown as given, never computed. A missing
 * value is `null` and renders "Not available" or is omitted.
 */

type Money = number | string;

export type AdminInvoiceRow = Readonly<{
  /** Invoice identifier; detail navigation uses this id only. */
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerId: string | null;
  /** Plan and interval as shown, for example "Standard · monthly". */
  planLabel: string | null;
  total: Money;
  currencyCode: string;
  /** Raw status. */
  status: string;
  issuedAtUtc: string;
  dueAtUtc: string | null;
  receiptNumber: string | null;
}>;

type Party = Readonly<{
  name: string;
  email: string | null;
  addressLines: readonly string[];
}>;

export type AdminInvoiceDetail = AdminInvoiceRow &
  Readonly<{
    issuer: Party;
    issuerLegalLines: readonly string[];
    billedTo: Party;
    periodStartUtc: string | null;
    periodEndUtc: string | null;
    lineItems: readonly Readonly<{
      id: string;
      description: string;
      detail: string | null;
      quantity: number | null;
      unitAmount: Money | null;
      amount: Money;
    }>[];
    subtotal: Money | null;
    adjustments: readonly Readonly<{
      id: string;
      label: string;
      amount: Money;
    }>[];
    amountPaid: Money | null;
    amountDue: Money | null;
    payment: Readonly<{
      paidAtUtc: string;
      method: string | null;
      reference: string | null;
      paymentId: string | null;
    }> | null;
    subscriptionId: string | null;
    notes: readonly string[];
    /** `null` when no history is kept. */
    history: readonly BillingTimelineEvent[] | null;
  }>;

/** Reference KPI tiles. */
export type AdminInvoiceSummary = Readonly<{
  collected: AdminMetric;
  invoiced: AdminMetric;
  outstanding: AdminMetric;
  overdue: AdminMetric;
}>;

/** Invoice status; unknown values are shown as returned. */
export function describeInvoiceStatus(status: string): StatusPresentation {
  switch (status) {
    case "Paid":
      return { label: "Paid", tone: "success" };
    case "Due":
    case "Open":
      return { label: "Due", tone: "warning" };
    case "Overdue":
      return { label: "Overdue", tone: "danger" };
    case "Void":
      return { label: "Void", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

const quantityFormat = new Intl.NumberFormat("en-US");

function party(label: string, source: Party): BillingDocumentParty {
  return {
    label,
    lines: [...(source.email ? [source.email] : []), ...source.addressLines],
    name: source.name,
  };
}

function notice(invoice: AdminInvoiceDetail): BillingDocumentProps["notice"] {
  const due = formatUtcDate(invoice.dueAtUtc);
  switch (invoice.status) {
    case "Paid": {
      const payment = invoice.payment;
      if (!payment) return undefined;
      const paidOn = formatUtcDate(payment.paidAtUtc);
      const line = [
        paidOn ? `Paid on ${paidOn}` : "Paid",
        payment.method,
        payment.reference ? `Ref ${payment.reference}` : null,
        invoice.receiptNumber ? `Receipt ${invoice.receiptNumber}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return { content: line, tone: "success" };
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

/** Document sheet content; omits anything that was not supplied. */
export function invoiceDocumentContent(
  invoice: AdminInvoiceDetail,
): Omit<BillingDocumentProps, "brandName"> {
  const money = (amount: Money) =>
    formatMinorUnits(amount, invoice.currencyCode);
  const issued = formatUtcDate(invoice.issuedAtUtc);
  const due = formatUtcDate(invoice.dueAtUtc);
  const start = formatUtcDate(invoice.periodStartUtc);
  const end = formatUtcDate(invoice.periodEndUtc);
  return {
    facts: [
      ...(issued ? [{ label: "Issue date", value: issued }] : []),
      ...(due ? [{ label: "Due date", value: due }] : []),
      ...(start && end
        ? [{ label: "Billing period", value: `${start} – ${end}` }]
        : []),
      { label: "Currency", value: invoice.currencyCode },
    ],
    footerDetails: invoice.issuerLegalLines,
    footerNotes: invoice.notes,
    issuerName: invoice.issuer.name,
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
    parties: [
      party("Billed to", invoice.billedTo),
      party("From", invoice.issuer),
    ],
    status: describeInvoiceStatus(invoice.status),
    title: "Invoice",
    totals: [
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
    ],
  };
}
