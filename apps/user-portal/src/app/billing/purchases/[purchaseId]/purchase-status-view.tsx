"use client";

import { isApiError } from "@template/api-client";
import type { GetSubscriptionPurchaseStatusQueryResponse } from "@template/api-client/subscriptions";
import { useSubscriptionPurchaseStatus } from "@template/api-react/subscriptions";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  ErrorState,
  RefreshIcon,
  Skeleton,
  buttonVariants,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import { useEffect } from "react";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  describePurchaseStatus,
  formatBillingDate,
  formatBillingDateTime,
  paymentMethodLabel,
} from "@/lib/billing-display";
import {
  purchaseTimeline,
  type PurchaseTimelineEvent,
} from "@/lib/billing-presentation";
import { browserCheckoutAttemptStore } from "@/lib/checkout-attempt";
import { useRememberedCheckoutAttempt } from "@/lib/use-checkout-attempt";
import {
  DetailList,
  StatusBadge,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../billing-ui";

/**
 * Authoritative purchase outcome. Provider redirect parameters are never read;
 * only the backend status for this purchase id and billing owner is shown.
 */
export function PurchaseStatusView({
  purchaseId,
  supportEmail,
}: Readonly<{ purchaseId: string; supportEmail: string }>) {
  const ownerType = resolveBillingOwnerType();
  const status = useSubscriptionPurchaseStatus(purchaseId, ownerType);
  const remembered = useRememberedCheckoutAttempt();
  const retryAttempt =
    remembered?.purchaseId === purchaseId ? remembered : undefined;
  const settled = status.data?.isTerminal === true;
  const missing =
    !status.data && isApiError(status.error) && status.error.status === 404;

  // A settled purchase ends its attempt: a new checkout gets a new key.
  useEffect(() => {
    if (settled) browserCheckoutAttemptStore().markSettled(purchaseId);
  }, [purchaseId, settled]);

  // An unknown purchase (another account, or removed by the backend) must not
  // keep prompting checkout to "check its payment status".
  useEffect(() => {
    if (missing) browserCheckoutAttemptStore().forgetPurchase(purchaseId);
  }, [missing, purchaseId]);

  if (status.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading purchase status" role="status">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!status.data) {
    return (
      <Card>
        <ErrorState
          action={
            <Link
              className={buttonVariants({ size: "sm", variant: "secondary" })}
              href={billingRoutes.overview}
            >
              Go to billing
            </Link>
          }
          description={
            missing
              ? "We could not find this purchase for your account."
              : "We could not check this purchase right now. Your payment is not affected."
          }
          {...(missing
            ? {}
            : {
                onRetry: () => void status.refetch(),
                retrying: status.isFetching,
              })}
          title={
            missing ? "Purchase not found" : "We couldn't load this purchase"
          }
        />
      </Card>
    );
  }

  return (
    <PurchaseStatusDetails
      data={status.data}
      isFetching={status.isFetching}
      onRefresh={() => void status.refetch()}
      pollingExhausted={status.pollingExhausted}
      refreshFailed={status.isError}
      retryHref={
        retryAttempt
          ? billingRoutes.checkoutForPlan(
              retryAttempt.planId,
              retryAttempt.billingInterval,
            )
          : billingRoutes.checkout
      }
      supportEmail={supportEmail}
    />
  );
}

export function PurchaseStatusDetails({
  data,
  isFetching,
  onRefresh,
  pollingExhausted,
  refreshFailed,
  retryHref,
  supportEmail,
}: Readonly<{
  data: GetSubscriptionPurchaseStatusQueryResponse;
  isFetching: boolean;
  onRefresh: () => void;
  pollingExhausted: boolean;
  refreshFailed: boolean;
  retryHref: string;
  supportEmail: string;
}>) {
  const presentation = describePurchaseStatus(data.status);
  const polling =
    data.shouldContinuePolling && !pollingExhausted && !refreshFailed;
  const manualRefresh =
    !polling && (data.shouldContinuePolling || presentation.kind === "unknown");
  const amount = formatMinorUnits(data.amount, data.currencyCode);
  const details = [
    { label: "Amount", value: amount },
    { label: "Payment provider", value: data.paymentProviderName },
    {
      label: "Payment method",
      value: paymentMethodLabel(data.paymentMethodType),
    },
    {
      label: "Reference",
      value: <span className="font-mono">{data.merchantReference}</span>,
    },
    ...optionalDetail(
      "Paid on",
      formatBillingDateTime(data.paymentCompletedAtUtc),
    ),
    ...(polling || manualRefresh
      ? optionalDetail(
          "Payment window closes",
          formatBillingDateTime(data.paymentExpiresAtUtc),
        )
      : []),
    ...optionalDetail(
      "Current period ends",
      formatBillingDate(data.currentPeriodEndUtc),
    ),
  ];

  const timeline = purchaseTimeline(data);

  return (
    <div
      className={
        timeline.length > 0
          ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
          : undefined
      }
    >
      <Card
        aria-labelledby="purchase-details-heading"
        data-purchase-status={data.status}
        role="region"
      >
        <CardHeader>
          <CardTitle as="h3" id="purchase-details-heading">
            Details
          </CardTitle>
          <span className="text-small text-fg-muted font-mono">
            {data.merchantReference}
          </span>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            aria-live="polite"
            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <h2 className="text-h2 text-fg">{presentation.title}</h2>
              <p className="text-fg-muted mt-1">{presentation.description}</p>
            </div>
            <StatusBadge tone={presentation.tone}>
              {polling ? "Updating…" : presentation.title}
            </StatusBadge>
          </div>

          {pollingExhausted ? (
            <Alert variant="warning">
              This is taking longer than usual. Your payment may still be
              processing — this does not mean it failed. Check again in a
              moment.
            </Alert>
          ) : null}
          {refreshFailed ? (
            <Alert variant="warning">
              We could not refresh the status just now. The last confirmed state
              is shown below.
            </Alert>
          ) : null}
          {presentation.kind === "blocked" && data.fulfillmentBlockedAtUtc ? (
            <Alert variant="warning">
              Contact{" "}
              <a
                className="font-medium underline"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>{" "}
              and include reference {data.merchantReference}.
            </Alert>
          ) : null}

          <DetailList items={details} />
        </CardContent>
        <CardFooter>
          {manualRefresh || refreshFailed ? (
            <Button
              leadingIcon={<RefreshIcon />}
              loading={isFetching}
              onClick={onRefresh}
              variant="secondary"
            >
              {isFetching ? "Checking…" : "Check again"}
            </Button>
          ) : null}
          {presentation.kind === "payment-unsuccessful" ? (
            <Link className={primaryButtonClass} href={retryHref}>
              Start a new checkout
            </Link>
          ) : null}
          {presentation.kind === "active" ||
          presentation.kind === "scheduled" ? (
            <Link className={primaryButtonClass} href={billingRoutes.overview}>
              View your subscription
            </Link>
          ) : (
            <Link
              className={secondaryButtonClass}
              href={billingRoutes.overview}
            >
              Go to billing
            </Link>
          )}
        </CardFooter>
      </Card>
      {timeline.length > 0 ? <PurchaseTimeline events={timeline} /> : null}
    </div>
  );
}

/**
 * Recorded purchase events (reference `.timeline`). Only timestamps the
 * backend returns are shown; there is no event feed (DR-057).
 */
export function PurchaseTimeline({
  events,
}: Readonly<{ events: ReadonlyArray<PurchaseTimelineEvent> }>) {
  return (
    <Card aria-labelledby="purchase-timeline-heading" role="region">
      <CardHeader>
        <CardTitle as="h3" id="purchase-timeline-heading">
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-0">
          {events.map((event) => (
            <li
              className="[&:not(:last-child)]:before:bg-border relative flex gap-3.5 pb-4 last:pb-0 [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:top-4 [&:not(:last-child)]:before:bottom-0 [&:not(:last-child)]:before:left-[5px] [&:not(:last-child)]:before:w-0.5"
              data-timeline-event={event.id}
              key={event.id}
            >
              <span
                aria-hidden="true"
                className="bg-brand ring-brand-soft mt-[5px] size-3 shrink-0 rounded-full ring-4"
              />
              <div className="min-w-0">
                <p className="text-fg font-medium">{event.label}</p>
                <p className="text-caption text-fg-subtle">{event.at}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function optionalDetail(label: string, value: string | undefined) {
  return value ? [{ label, value }] : [];
}
