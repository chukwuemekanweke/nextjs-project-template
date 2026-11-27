"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { BillingDocument } from "@template/dashboard-ui/documents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DownloadIcon,
  KeyValueList,
  MailIcon,
  PrinterIcon,
} from "@template/ui-core";
import {
  AdminDetailHeader,
  type AdminActionAvailability,
} from "@/components/admin-patterns";
import {
  UNAVAILABLE_ACTION_DESCRIPTION,
  formatUtcDateTime,
  type AdminDetailState,
} from "../admin-billing-shared/billing-model";
import {
  BillingDetailFallback,
  BillingStatusBadge,
  BillingTimeline,
  IntentButton,
  NotAvailable,
  UnavailableActionHint,
} from "../admin-billing-shared/billing-sections";
import {
  adminInvoiceDocumentContent,
  describeInvoiceStatus,
  invoicePlanLabel,
  type AdminInvoiceAction,
  type AdminInvoiceDetail,
} from "./invoices-model";

/*
 * Invoice detail (reference `AdminInvoiceDetail*`): header, the invoice
 * document, an invoice card with related records and a history timeline.
 * PREVIEW-ONLY (DR-160): no route until an admin invoice API exists.
 * Resend and PDF download are enabled only when the record reports them
 * available and the caller handles them; related-record links appear only
 * with real ids and caller-supplied URL builders. In print only the
 * document remains.
 */

export function InvoiceDetailScreen({
  backHref,
  brandName,
  busyAction,
  customerHref,
  onAction,
  onRetry,
  paymentHref,
  state,
  subscriptionHref,
}: Readonly<{
  /** Invoices list URL, once the route exists. */
  backHref?: string;
  /** Product name for the document brand mark. */
  brandName: string;
  busyAction?: AdminInvoiceAction["type"];
  customerHref?: (customerId: string) => string;
  onAction?: (action: AdminInvoiceAction) => void;
  onRetry?: () => void;
  paymentHref?: (paymentId: string) => string;
  state: AdminDetailState<AdminInvoiceDetail>;
  subscriptionHref?: (subscriptionId: string) => string;
}>) {
  const id = useId();
  if (state.state !== "ready") {
    return (
      <BillingDetailFallback
        backLink={backHref ? <Link href={backHref}>All invoices</Link> : null}
        onRetry={onRetry}
        resourceLabel="Invoice"
        state={state}
      />
    );
  }
  const invoice = state.record;
  const status = describeInvoiceStatus(invoice.status);
  const printHintId = `${id}-print-hint`;

  return (
    <section
      className="grid gap-5 md:gap-6"
      data-invoice-status={invoice.status}
    >
      <div className="grid gap-2 print:hidden" data-print-hidden="">
        <AdminDetailHeader
          actions={
            <IntentButton
              hintId={printHintId}
              intent="print"
              leadingIcon={<PrinterIcon />}
              onAction={
                onAction ? () => onAction({ type: "print" }) : undefined
              }
              size="sm"
              variant="secondary"
            >
              Print
            </IntentButton>
          }
          back={backHref ? { href: backHref, label: "Invoices" } : undefined}
          badges={<BillingStatusBadge status={status} />}
          meta={[invoice.customerDisplayName, invoicePlanLabel(invoice)]
            .filter(Boolean)
            .join(" · ")}
          title={invoice.invoiceNumber}
        />
        {onAction ? null : (
          <UnavailableActionHint id={printHintId}>
            Printing is not available here.
          </UnavailableActionHint>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-5 md:gap-6">
        <div className="min-w-0 flex-[999_1_560px] print:flex-none print:basis-full">
          <BillingDocument
            brandName={brandName}
            {...adminInvoiceDocumentContent(invoice)}
          />
        </div>
        <aside
          className="grid min-w-0 flex-[1_1_280px] gap-5 md:gap-6 print:hidden"
          data-print-hidden=""
        >
          <Card>
            <CardHeader>
              <CardTitle as="h2">Invoice</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <KeyValueList
                className="md:grid-cols-[minmax(96px,120px)_1fr]"
                items={[
                  {
                    label: "Status",
                    value: <BillingStatusBadge status={status} />,
                  },
                  {
                    label: "Customer",
                    value: linked(
                      invoice.customerDisplayName,
                      invoice.customerId,
                      customerHref,
                    ),
                  },
                  {
                    label: "Subscription",
                    value: linked(
                      invoicePlanLabel(invoice),
                      invoice.subscriptionId,
                      subscriptionHref,
                    ),
                  },
                  {
                    label: "Payment",
                    value: invoice.payment?.reference ? (
                      linked(
                        <span className="font-mono">
                          {invoice.payment.reference}
                        </span>,
                        invoice.payment.paymentId,
                        paymentHref,
                      )
                    ) : (
                      <NotAvailable label="No payment" />
                    ),
                  },
                  {
                    label: "Receipt",
                    value: invoice.receiptNumber ? (
                      <span className="font-mono">{invoice.receiptNumber}</span>
                    ) : (
                      <NotAvailable label="No receipt" />
                    ),
                  },
                ]}
              />
              <div className="grid gap-2">
                <AvailabilityButton
                  availability={invoice.actions.resend}
                  busy={busyAction === "resend"}
                  icon={<MailIcon />}
                  intent="resend"
                  label="Resend to customer"
                  onRequest={
                    onAction
                      ? () =>
                          onAction({ invoiceId: invoice.id, type: "resend" })
                      : undefined
                  }
                />
                <AvailabilityButton
                  availability={invoice.actions.downloadPdf}
                  busy={busyAction === "downloadPdf"}
                  icon={<DownloadIcon />}
                  intent="downloadPdf"
                  label="Download PDF"
                  onRequest={
                    onAction
                      ? () =>
                          onAction({
                            invoiceId: invoice.id,
                            type: "downloadPdf",
                          })
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h2">History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.history ? (
                <BillingTimeline
                  events={invoice.history}
                  formatAt={formatUtcDateTime}
                  label="Invoice history"
                />
              ) : (
                <p className="text-small text-fg-muted">
                  History is not available for this invoice.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function linked(
  label: ReactNode,
  recordId: string | null,
  href?: (recordId: string) => string,
): ReactNode {
  if (!label) return <NotAvailable />;
  if (!recordId || !href) return label;
  return (
    <Link
      className="text-brand-ink hover:underline focus-visible:underline"
      href={href(recordId)}
    >
      {label}
    </Link>
  );
}

/**
 * An operation the record reports as available and the caller handles;
 * otherwise disabled with the backend's reason or the default.
 */
function AvailabilityButton({
  availability,
  busy,
  icon,
  intent,
  label,
  onRequest,
}: Readonly<{
  availability: AdminActionAvailability;
  busy: boolean;
  icon: ReactNode;
  intent: AdminInvoiceAction["type"];
  label: string;
  onRequest?: () => void;
}>) {
  const hintId = useId();
  const enabled = availability.state === "available" && Boolean(onRequest);
  const reason =
    availability.state === "unavailable"
      ? availability.reason
      : UNAVAILABLE_ACTION_DESCRIPTION;
  return (
    <div className="grid gap-1">
      <IntentButton
        busy={
          busy ||
          (availability.state === "available" && Boolean(availability.pending))
        }
        fullWidth
        hintId={hintId}
        intent={intent}
        leadingIcon={icon}
        onAction={enabled ? onRequest : undefined}
        variant="secondary"
      >
        {label}
      </IntentButton>
      {enabled ? null : (
        <UnavailableActionHint id={hintId}>{reason}</UnavailableActionHint>
      )}
    </div>
  );
}
