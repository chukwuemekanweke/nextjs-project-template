"use client";

import type {
  BillingAccountOwnerType,
  GetCurrentSubscriptionQueryResponse,
} from "@template/api-client/subscriptions";
import {
  useCancelSubscriptionAtPeriodEnd,
  useCurrentSubscription,
} from "@template/api-react/subscriptions";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Modal,
  Skeleton,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  billingCadence,
  billingIntervalLabel,
  canScheduleCancellation,
  describeBillingLoadError,
  describeCancellationError,
  describeCancellationResult,
  describeSubscription,
  formatBillingDate,
} from "@/lib/billing-display";
import {
  DetailList,
  StatusBadge,
  primaryButtonClass,
  secondaryButtonClass,
} from "./billing-ui";

export function CurrentSubscriptionCard() {
  const ownerType = resolveBillingOwnerType();
  const current = useCurrentSubscription(ownerType);

  return (
    <Card>
      <CardContent>
        {current.isPending ? (
          <div
            aria-busy="true"
            aria-label="Loading subscription"
            className="space-y-4"
            role="status"
          >
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : current.isError ? (
          <>
            <CardTitle>Subscription</CardTitle>
            <div className="mt-4">
              <Alert variant="error">
                {describeBillingLoadError(current.error, "your subscription")}
              </Alert>
            </div>
          </>
        ) : current.data === null ? (
          <NoSubscription />
        ) : (
          <SubscriptionDetails
            ownerType={ownerType}
            subscription={current.data}
          />
        )}
      </CardContent>
    </Card>
  );
}

function NoSubscription() {
  return (
    <div className="space-y-4">
      <div>
        <CardTitle>No active subscription</CardTitle>
        <CardDescription>
          You are not subscribed to a plan. Choose a plan to get started.
        </CardDescription>
      </div>
      <Link className={primaryButtonClass} href={billingRoutes.checkout}>
        View plans
      </Link>
    </div>
  );
}

export function SubscriptionDetails({
  ownerType,
  subscription,
}: Readonly<{
  ownerType: BillingAccountOwnerType;
  subscription: GetCurrentSubscriptionQueryResponse;
}>) {
  const presentation = describeSubscription(subscription);
  const showNextBilling =
    subscription.autoRenew &&
    !subscription.cancelAtPeriodEnd &&
    subscription.nextBillingAtUtc;
  const periodStart = formatBillingDate(subscription.currentPeriodStartUtc);
  const periodEnd = formatBillingDate(subscription.currentPeriodEndUtc);
  const items = [
    {
      label: "Price",
      value: `${formatMinorUnits(subscription.planPrice, subscription.currencyCode)} / ${billingCadence(subscription.billingInterval)}`,
    },
    {
      label: "Billing",
      value: billingIntervalLabel(subscription.billingInterval),
    },
    ...(periodStart
      ? [{ label: "Current period started", value: periodStart }]
      : []),
    ...(periodEnd ? [{ label: "Current period ends", value: periodEnd }] : []),
    ...(showNextBilling
      ? [
          {
            label: "Next billing date",
            value: formatBillingDate(subscription.nextBillingAtUtc) ?? "—",
          },
        ]
      : []),
    {
      label: "Automatic renewal",
      value:
        subscription.autoRenew && !subscription.cancelAtPeriodEnd
          ? "On"
          : "Off",
    },
    ...(subscription.cancelAtPeriodEnd
      ? [
          {
            label: "Cancellation effective",
            value:
              formatBillingDate(subscription.cancellationEffectiveAtUtc) ?? "—",
          },
          ...(subscription.cancellationRequestedAtUtc
            ? [
                {
                  label: "Cancellation requested",
                  value:
                    formatBillingDate(
                      subscription.cancellationRequestedAtUtc,
                    ) ?? "—",
                },
              ]
            : []),
        ]
      : []),
  ];

  return (
    <div className="space-y-5" data-subscription-status={subscription.status}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Current plan
          </p>
          <CardTitle>{subscription.planName}</CardTitle>
          <CardDescription>{presentation.description}</CardDescription>
        </div>
        <StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge>
      </div>
      {subscription.lifecycleStatus === "PastDue" ? (
        <Alert variant="warning">
          Your renewal payment has not been settled. Check your billing history
          for the latest payment attempt.
        </Alert>
      ) : null}
      <DetailList items={items} />
      {canScheduleCancellation(subscription) ? (
        <CancelAtPeriodEnd ownerType={ownerType} subscription={subscription} />
      ) : null}
    </div>
  );
}

function CancelAtPeriodEnd({
  ownerType,
  subscription,
}: Readonly<{
  ownerType: BillingAccountOwnerType;
  subscription: GetCurrentSubscriptionQueryResponse;
}>) {
  const cancel = useCancelSubscriptionAtPeriodEnd();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<string>();
  const active = useRef(false);
  const periodEnd = formatBillingDate(subscription.currentPeriodEndUtc);
  const dismissError = useCallback(() => setError(undefined), []);
  const dismissResult = useCallback(() => setResult(undefined), []);

  async function confirm() {
    if (active.current) return;
    active.current = true;
    setError(undefined);
    try {
      const response = await cancel.mutateAsync({
        billingAccountOwnerType: ownerType,
      });
      setConfirming(false);
      setResult(describeCancellationResult(response));
    } catch (caught) {
      setError(describeCancellationError(caught));
    } finally {
      active.current = false;
    }
  }

  return (
    <div className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
      {result ? (
        <Alert onDismiss={dismissResult} variant="success">
          {result}
        </Alert>
      ) : null}
      {error && !confirming ? (
        <Alert onDismiss={dismissError} variant="error">
          {error}
        </Alert>
      ) : null}
      <button
        className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        disabled={cancel.isPending}
        onClick={() => setConfirming(true)}
        type="button"
      >
        Cancel at period end
      </button>
      <Modal
        description={
          periodEnd
            ? `Your subscription will not renew. You keep full access until the end of your current billing period on ${periodEnd}. No refund is issued for the current period.`
            : "Your subscription will not renew. You keep full access until the end of your current billing period. No refund is issued for the current period."
        }
        onClose={() => {
          if (!cancel.isPending) setConfirming(false);
        }}
        open={confirming}
        size="compact"
        title="Cancel your subscription?"
      >
        <div className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              className={secondaryButtonClass}
              disabled={cancel.isPending}
              onClick={() => setConfirming(false)}
              type="button"
            >
              Keep subscription
            </button>
            <button
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              disabled={cancel.isPending}
              onClick={() => void confirm()}
              type="button"
            >
              {cancel.isPending ? "Cancelling…" : "Cancel at period end"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
