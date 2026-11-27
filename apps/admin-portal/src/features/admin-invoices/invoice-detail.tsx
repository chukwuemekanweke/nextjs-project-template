"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BillingDocument } from "@template/dashboard-ui/documents";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DownloadIcon,
  KeyValueList,
  MailIcon,
  PrinterIcon,
} from "@template/ui-core";
import { AdminDetailHeader } from "@/components/admin-patterns";
import {
  formatUtcDateTime,
  type AdminDetailState,
} from "../admin-billing-shared/billing-model";
import {
  BillingDetailFallback,
  BillingStatusBadge,
  BillingTimeline,
  NotAvailable,
  UnavailableActionHint,
} from "../admin-billing-shared/billing-sections";
import {
  describeInvoiceStatus,
  invoiceDocumentContent,
  type AdminInvoiceDetail,
} from "./invoices-model";

/*
 * Invoice detail (reference `AdminInvoiceDetail*`): header, the invoice
 * document, an invoice card with related records and a history timeline.
 * PREVIEW-ONLY (BE-DS-007, DR-160). Resend and PDF download are disabled
 * with their reason; related-record links appear only with ids and
 * caller-supplied URL builders. In print only the document remains.
 */

export function InvoiceDetailScreen({
  backHref,
  brandName,
  customerHref,
  onRetry,
  paymentHref,
  state,
  subscriptionHref,
}: Readonly<{
  /** Invoices list URL, once the route exists. */
  backHref?: string;
  /** Product name for the document brand mark. */
  brandName: string;
  customerHref?: (customerId: string) => string;
  onRetry?: () => void;
  paymentHref?: (paymentId: string) => string;
  state: AdminDetailState<AdminInvoiceDetail>;
  subscriptionHref?: (subscriptionId: string) => string;
}>) {
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

  return (
    <section
      className="grid gap-5 md:gap-6"
      data-invoice-status={invoice.status}
    >
      <div className="print:hidden">
        <AdminDetailHeader
          actions={
            <Button
              leadingIcon={<PrinterIcon />}
              onClick={() => window.print()}
              size="sm"
              type="button"
              variant="secondary"
            >
              Print
            </Button>
          }
          back={backHref ? { href: backHref, label: "Invoices" } : undefined}
          badges={<BillingStatusBadge status={status} />}
          meta={[invoice.customerName, invoice.planLabel]
            .filter(Boolean)
            .join(" · ")}
          title={invoice.invoiceNumber}
        />
      </div>
      <div className="flex flex-wrap items-start gap-5 md:gap-6">
        <div className="min-w-0 flex-[999_1_560px] print:basis-full">
          <BillingDocument
            brandName={brandName}
            {...invoiceDocumentContent(invoice)}
          />
        </div>
        <aside className="grid min-w-0 flex-[1_1_280px] gap-5 md:gap-6 print:hidden">
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
                      invoice.customerName,
                      invoice.customerId,
                      customerHref,
                    ),
                  },
                  {
                    label: "Subscription",
                    value: linked(
                      invoice.planLabel,
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
                <Button
                  aria-describedby="invoice-actions-hint"
                  disabled
                  fullWidth
                  leadingIcon={<MailIcon />}
                  type="button"
                  variant="secondary"
                >
                  Resend to customer
                </Button>
                <Button
                  aria-describedby="invoice-actions-hint"
                  disabled
                  fullWidth
                  leadingIcon={<DownloadIcon />}
                  type="button"
                  variant="secondary"
                >
                  Download PDF
                </Button>
                <UnavailableActionHint id="invoice-actions-hint">
                  Resending and PDF download are not available yet.
                </UnavailableActionHint>
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
