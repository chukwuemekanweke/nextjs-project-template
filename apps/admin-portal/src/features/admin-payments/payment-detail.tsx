import Link from "next/link";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  KeyValueList,
  formatMinorUnits,
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
} from "../admin-billing-shared/billing-sections";
import {
  describeFulfillment,
  describePaymentStatus,
  paymentIntentLabel,
  paymentMethodLabel,
  type AdminPaymentDetail,
} from "./payments-model";

/*
 * Payment detail (reference `AdminPaymentDetail*`). Presentation only and
 * read-only: no refund, retry or charge actions exist. Fulfillment comes
 * only from the reported fulfillment, never from the payment status, and
 * the provider event log shows only logged events. The reference "Copy
 * link" action and invoice links are omitted (no route; invoices are
 * FE-UI-018).
 */

export function PaymentDetailScreen({
  backHref,
  onRetry,
  ownerHref,
  state,
}: Readonly<{
  /** Payments list URL, once the route exists. */
  backHref?: string;
  onRetry?: () => void;
  /** User detail URL, once that route exists (FE-UI-013). */
  ownerHref?: (ownerId: string) => string;
  state: AdminDetailState<AdminPaymentDetail>;
}>) {
  if (state.state !== "ready") {
    return (
      <BillingDetailFallback
        backLink={backHref ? <Link href={backHref}>All payments</Link> : null}
        onRetry={onRetry}
        resourceLabel="Payment"
        state={state}
      />
    );
  }
  const payment = state.record;
  const status = describePaymentStatus(payment.paymentStatus);
  const amount = formatMinorUnits(payment.amount, payment.currencyCode);
  const fulfillment = describeFulfillment(payment.fulfillment);
  const fulfillmentAt =
    payment.fulfillment.status === "fulfilled" ||
    payment.fulfillment.status === "blocked"
      ? formatUtcDateTime(payment.fulfillment.atUtc)
      : undefined;

  return (
    <section
      className="grid gap-5 md:gap-6"
      data-payment-status={payment.paymentStatus}
    >
      <AdminDetailHeader
        back={backHref ? { href: backHref, label: "Payments" } : undefined}
        badges={<BillingStatusBadge status={status} />}
        meta={`${amount} · ${paymentIntentLabel(payment.intent)} · ${payment.providerName}`}
        title={payment.merchantReference}
      />
      <div className="grid items-start gap-5 md:gap-6 xl:grid-cols-2">
        <div className="grid gap-5 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueList
                items={[
                  {
                    label: "Merchant reference",
                    value: (
                      <span className="font-mono">
                        {payment.merchantReference}
                      </span>
                    ),
                  },
                  {
                    label: "Provider reference",
                    value: payment.providerReference ? (
                      <span className="font-mono">
                        {payment.providerReference}
                      </span>
                    ) : (
                      <NotAvailable />
                    ),
                  },
                  {
                    label: "User",
                    value: payment.ownerDisplayName ? (
                      ownerHref && payment.ownerId ? (
                        <Link
                          className="text-brand-ink hover:underline"
                          href={ownerHref(payment.ownerId)}
                        >
                          {payment.ownerDisplayName}
                        </Link>
                      ) : (
                        payment.ownerDisplayName
                      )
                    ) : (
                      <NotAvailable />
                    ),
                  },
                  {
                    label: "Tenant",
                    value: payment.tenantName ?? <NotAvailable />,
                  },
                  { label: "Provider", value: payment.providerName },
                  {
                    label: "Method",
                    value: payment.paymentMethodType ? (
                      paymentMethodLabel(payment.paymentMethodType)
                    ) : (
                      <NotAvailable />
                    ),
                  },
                  {
                    label: "Intent",
                    value: paymentIntentLabel(payment.intent),
                  },
                  { label: "Amount", value: amount },
                  {
                    label: "Created",
                    value: formatUtcDateTime(payment.createdAtUtc) ?? (
                      <NotAvailable />
                    ),
                  },
                  {
                    label: "Completed",
                    value: formatUtcDateTime(payment.completedAtUtc) ?? (
                      <NotAvailable label="Not completed" />
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
          <Card data-fulfillment={payment.fulfillment.status}>
            <CardHeader>
              <CardTitle as="h2">Fulfillment outcome</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert title={fulfillment.title} variant={fulfillment.variant}>
                {fulfillment.description}
                {fulfillmentAt ? ` Recorded ${fulfillmentAt}.` : null}
              </Alert>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-5 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Status history</CardTitle>
            </CardHeader>
            <CardContent>
              {payment.statusHistory ? (
                <BillingTimeline
                  events={payment.statusHistory}
                  formatAt={formatUtcDateTime}
                  label="Payment status history"
                />
              ) : (
                <p className="text-small text-fg-muted">
                  Status history is not available for this payment.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h2">Webhooks &amp; reconciliation</CardTitle>
            </CardHeader>
            {payment.providerEvents ? (
              <DataTable
                caption="Provider events"
                columns={[
                  {
                    cell: (event) => (
                      <span className="text-fg font-medium break-all">
                        {event.event}
                      </span>
                    ),
                    header: "Event",
                  },
                  { cell: (event) => event.source, header: "Source" },
                  { cell: (event) => event.result, header: "Result" },
                  {
                    cell: (event) => {
                      const at = formatUtcDateTime(event.atUtc);
                      return at ? (
                        <time dateTime={event.atUtc}>{at}</time>
                      ) : (
                        <NotAvailable />
                      );
                    },
                    header: "At",
                  },
                ]}
                emptyMessage="No provider events were logged."
                keyField={(event) => event.id}
                mobileLayout="stack"
                rows={payment.providerEvents}
                variant="embedded"
              />
            ) : (
              <CardContent>
                <p className="text-small text-fg-muted">
                  The provider event log is not available for this payment.
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
