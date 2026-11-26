"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  KeyValueList,
  formatMinorUnits,
} from "@template/ui-core";
import {
  AdminDetailHeader,
  AdminKpiCard,
  AdminKpiGrid,
  type AdminMetric,
} from "@/components/admin-patterns";
import {
  formatUtcDate,
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
  autoRenewLabel,
  availableSubscriptionActions,
  describeSubscriptionStatus,
  ownerTypeLabel,
  subscriptionActionCopy,
  subscriptionSourceLabel,
  type AdminSubscriptionDetail,
  type SubscriptionAction,
} from "./subscriptions-model";
import { describePaymentStatus } from "../admin-payments/payments-model";

/*
 * Subscription detail (reference `AdminSubscriptionDetail*`). Actions are
 * intents: each opens its own confirmation, and confirming reports the
 * action through `onAction`. The screen never shows that a cancellation or
 * retry happened; the page re-reads the subscription after the backend
 * responds. Without `onAction` the actions are disabled with a reason.
 * Payment rows have no invoice links (FE-UI-018).
 */

const NOT_REPORTED: AdminMetric = {
  reason: "Not reported by the backend.",
  state: "unavailable",
};

export function SubscriptionDetailScreen({
  backHref,
  busyAction,
  onAction,
  onRetry,
  ownerHref,
  state,
}: Readonly<{
  backHref?: string;
  /** Action the caller is processing; its button shows a busy state. */
  busyAction?: SubscriptionAction;
  onAction?: (action: SubscriptionAction) => void;
  onRetry?: () => void;
  ownerHref?: (ownerId: string) => string;
  state: AdminDetailState<AdminSubscriptionDetail>;
}>) {
  const id = useId();
  const hintId = `${id}-actions-hint`;
  const [confirming, setConfirming] = useState<SubscriptionAction | null>(null);

  if (state.state !== "ready") {
    return (
      <BillingDetailFallback
        backLink={
          backHref ? <Link href={backHref}>All subscriptions</Link> : null
        }
        onRetry={onRetry}
        resourceLabel="Subscription"
        state={state}
      />
    );
  }

  const subscription = state.record;
  const actions = availableSubscriptionActions(subscription);
  const owner = subscription.ownerDisplayName;
  const confirmCopy = confirming
    ? subscriptionActionCopy(confirming, subscription)
    : null;

  return (
    <section
      className="grid gap-5 md:gap-6"
      data-lifecycle-status={subscription.lifecycleStatus}
    >
      <AdminDetailHeader
        actions={
          actions.length > 0 ? (
            <>
              {actions.map((action) => {
                const copy = subscriptionActionCopy(action, subscription);
                return (
                  <IntentButton
                    busy={busyAction === action}
                    hintId={onAction ? undefined : hintId}
                    intent={action}
                    key={action}
                    onAction={
                      onAction && !busyAction
                        ? () => setConfirming(action)
                        : undefined
                    }
                    variant={copy.variant}
                  >
                    {copy.label}
                  </IntentButton>
                );
              })}
            </>
          ) : null
        }
        back={backHref ? { href: backHref, label: "Subscriptions" } : undefined}
        badges={
          <BillingStatusBadge
            status={describeSubscriptionStatus(subscription)}
          />
        }
        meta={[
          `${ownerTypeLabel(subscription.ownerType)} billing account`,
          subscription.tenantName ? `Tenant: ${subscription.tenantName}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        title={
          owner ? `${subscription.planName} · ${owner}` : subscription.planName
        }
      />
      {actions.length > 0 && !onAction ? (
        <UnavailableActionHint id={hintId} />
      ) : null}
      <AdminKpiGrid>
        <AdminKpiCard
          label="Recurring amount"
          metric={
            subscription.planPrice !== null && subscription.currencyCode
              ? {
                  context: subscription.billingInterval
                    ? `per ${intervalNoun(subscription.billingInterval)}`
                    : undefined,
                  state: "ready",
                  value: formatMinorUnits(
                    subscription.planPrice,
                    subscription.currencyCode,
                  ),
                }
              : NOT_REPORTED
          }
        />
        <AdminKpiCard
          label="Current period"
          metric={periodMetric(
            subscription.currentPeriodStartUtc,
            subscription.currentPeriodEndUtc,
          )}
        />
        <AdminKpiCard
          label="Next billing"
          metric={
            formatUtcDate(subscription.nextBillingAtUtc)
              ? {
                  context:
                    subscription.autoRenew === null
                      ? undefined
                      : `Auto-renew ${autoRenewLabel(subscription.autoRenew)?.toLowerCase()}`,
                  state: "ready",
                  value: formatUtcDate(subscription.nextBillingAtUtc) ?? "",
                }
              : {
                  reason: "No next billing date reported.",
                  state: "unavailable",
                }
          }
        />
        <AdminKpiCard
          label="Lifetime paid"
          metric={
            subscription.lifetimePaid
              ? {
                  context: `${subscription.lifetimePaid.paymentCount} ${
                    subscription.lifetimePaid.paymentCount === 1
                      ? "payment"
                      : "payments"
                  }`,
                  state: "ready",
                  value: formatMinorUnits(
                    subscription.lifetimePaid.amount,
                    subscription.lifetimePaid.currencyCode,
                  ),
                }
              : NOT_REPORTED
          }
        />
      </AdminKpiGrid>
      <div className="grid items-start gap-5 md:gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValueList
              items={[
                {
                  label: "Owner",
                  value: owner ? (
                    ownerHref && subscription.ownerId ? (
                      <Link
                        className="text-brand-ink hover:underline"
                        href={ownerHref(subscription.ownerId)}
                      >
                        {owner}
                      </Link>
                    ) : (
                      owner
                    )
                  ) : (
                    <NotAvailable />
                  ),
                },
                {
                  label: "Owner type",
                  value: ownerTypeLabel(subscription.ownerType),
                },
                {
                  label: "Tenant",
                  value: subscription.tenantName ?? <NotAvailable />,
                },
                {
                  label: "Plan",
                  value: `${subscription.planName} (${subscription.planCode})`,
                },
                {
                  label: "Interval",
                  value: subscription.billingInterval ?? <NotAvailable />,
                },
                {
                  label: "Source",
                  value: subscriptionSourceLabel(subscription.source) ?? (
                    <NotAvailable />
                  ),
                },
                {
                  label: "Cancel at period end",
                  value: subscription.cancelAtPeriodEnd ? "Yes" : "No",
                },
                {
                  label: "Saved payment method",
                  value: subscription.savedPaymentMethod ?? <NotAvailable />,
                },
                {
                  label: "Started",
                  value: formatUtcDate(subscription.startedAtUtc) ?? (
                    <NotAvailable />
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Status history</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription.statusHistory ? (
              <BillingTimeline
                events={subscription.statusHistory}
                formatAt={formatUtcDate}
                label="Subscription status history"
              />
            ) : (
              <p className="text-small text-fg-muted">
                Status history is not available for this subscription.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle as="h2">Renewals &amp; payments</CardTitle>
        </CardHeader>
        {subscription.payments ? (
          <DataTable
            caption="Renewals and payments"
            columns={[
              {
                cell: (payment) => {
                  const text = formatUtcDate(payment.createdAtUtc);
                  return text ? (
                    <time dateTime={payment.createdAtUtc}>{text}</time>
                  ) : (
                    <NotAvailable />
                  );
                },
                header: "Date",
              },
              { cell: (payment) => payment.kind, header: "Type" },
              {
                cell: (payment) => (
                  <span className="font-mono break-all">
                    {payment.merchantReference}
                  </span>
                ),
                header: "Reference",
              },
              {
                cell: (payment) => (
                  <BillingStatusBadge
                    status={describePaymentStatus(payment.paymentStatus)}
                  />
                ),
                header: "Status",
              },
              {
                align: "right",
                cell: (payment) => (
                  <span className="text-fg font-semibold whitespace-nowrap">
                    {formatMinorUnits(payment.amount, payment.currencyCode)}
                  </span>
                ),
                header: "Amount",
              },
            ]}
            emptyMessage="No payments are linked to this subscription."
            keyField={(payment) => payment.id}
            mobileLayout="stack"
            rows={subscription.payments}
            variant="embedded"
          />
        ) : (
          <CardContent>
            <p className="text-small text-fg-muted">
              Payment history is not available for this subscription.
            </p>
          </CardContent>
        )}
      </Card>
      {confirmCopy && confirming ? (
        <ConfirmDialog
          confirmLabel={confirmCopy.confirmLabel}
          description={confirmCopy.description}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const action = confirming;
            setConfirming(null);
            onAction?.(action);
          }}
          open
          title={confirmCopy.title}
          tone={confirmCopy.tone}
        />
      ) : null}
    </section>
  );
}

function intervalNoun(billingInterval: string): string {
  if (billingInterval === "Monthly") return "month";
  if (billingInterval === "Yearly") return "year";
  return billingInterval.toLowerCase();
}

function periodMetric(start: string | null, end: string | null): AdminMetric {
  const from = formatUtcDate(start);
  const to = formatUtcDate(end);
  if (!from || !to) {
    return { reason: "No current period reported.", state: "unavailable" };
  }
  return { context: "UTC", state: "ready", value: `${from} – ${to}` };
}
