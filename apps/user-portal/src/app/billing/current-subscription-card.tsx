"use client";

import type {
  BillingAccountOwnerType,
  GetCurrentSubscriptionQueryResponse,
} from "@template/api-client/subscriptions";
import { useCancelSubscriptionAtPeriodEnd } from "@template/api-react/subscriptions";
import {
  Alert,
  Card,
  CardContent,
  Modal,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { billingRoutes } from "@/config/billing";
import {
  billingCadence,
  canScheduleCancellation,
  describeCancellationError,
  describeCancellationResult,
  describeSubscription,
  formatBillingDate,
} from "@/lib/billing-display";
import type { CheckoutAttempt } from "@/lib/checkout-attempt";
import {
  StatusBadge,
  primaryButtonClass,
  secondaryButtonClass,
} from "./billing-ui";
import { CalendarIcon, ClockIcon, RenewIcon } from "./checkout/checkout-icons";

const eyebrowClass =
  "text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400";

type Fact = Readonly<{ icon: ReactNode; label: string; value: string }>;

/** Backend dates only; nothing is derived from the billing interval. */
export function subscriptionFacts(
  subscription: GetCurrentSubscriptionQueryResponse,
): Fact[] {
  const iconClass = "h-6 w-6";
  const renewing = subscription.autoRenew && !subscription.cancelAtPeriodEnd;
  const periodStart = formatBillingDate(subscription.currentPeriodStartUtc);
  const periodEnd = formatBillingDate(subscription.currentPeriodEndUtc);
  const nextBilling = renewing
    ? formatBillingDate(subscription.nextBillingAtUtc)
    : undefined;
  const cancellationEffective = subscription.cancelAtPeriodEnd
    ? formatBillingDate(subscription.cancellationEffectiveAtUtc)
    : undefined;
  const cancellationRequested = subscription.cancelAtPeriodEnd
    ? formatBillingDate(subscription.cancellationRequestedAtUtc)
    : undefined;

  return [
    ...(periodStart
      ? [
          {
            icon: <CalendarIcon className={iconClass} />,
            label: "Current period started",
            value: periodStart,
          },
        ]
      : []),
    ...(periodEnd
      ? [
          {
            icon: <CalendarIcon className={iconClass} />,
            label: "Current period ends",
            value: periodEnd,
          },
        ]
      : []),
    ...(nextBilling
      ? [
          {
            icon: <CalendarIcon className={iconClass} />,
            label: "Next billing date",
            value: nextBilling,
          },
        ]
      : []),
    {
      icon: <RenewIcon className={iconClass} />,
      label: "Auto-renewal",
      value: renewing ? "Enabled" : "Off",
    },
    ...(subscription.cancelAtPeriodEnd
      ? [
          {
            icon: <ClockIcon className={iconClass} />,
            label: "Cancellation effective",
            value: cancellationEffective ?? "—",
          },
          ...(cancellationRequested
            ? [
                {
                  icon: <ClockIcon className={iconClass} />,
                  label: "Cancellation requested",
                  value: cancellationRequested,
                },
              ]
            : []),
        ]
      : []),
  ];
}

function FactList({ facts }: Readonly<{ facts: ReadonlyArray<Fact> }>) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {facts.map((fact) => (
        <div className="flex min-w-0 items-center gap-4" key={fact.label}>
          <span className="shrink-0 text-gray-500 dark:text-gray-400">
            {fact.icon}
          </span>
          <div className="min-w-0">
            <dt className="text-sm text-gray-500 dark:text-gray-400">
              {fact.label}
            </dt>
            <dd className="text-base font-semibold break-words text-gray-900 dark:text-white">
              {fact.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

function PlanPrice({
  subscription,
}: Readonly<{ subscription: GetCurrentSubscriptionQueryResponse }>) {
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
      <span className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
        {formatMinorUnits(subscription.planPrice, subscription.currencyCode)}
      </span>
      <span className="text-lg text-gray-500 dark:text-gray-400">
        / {billingCadence(subscription.billingInterval)}
      </span>
    </p>
  );
}

/**
 * The customer's current entitlement (Active, PastDue, cancellation
 * scheduled, Scheduled) with period-end cancellation, the only plan action the
 * backend supports. Upgrades and downgrades are intentionally not offered.
 */
export function CurrentSubscriptionCard({
  ownerType,
  subscription,
}: Readonly<{
  ownerType: BillingAccountOwnerType;
  subscription: GetCurrentSubscriptionQueryResponse;
}>) {
  const presentation = describeSubscription(subscription);
  const [scheduledResult, setScheduledResult] = useState<string>();
  const dismissResult = useCallback(() => setScheduledResult(undefined), []);
  const cancellationDate = formatBillingDate(
    subscription.cancellationEffectiveAtUtc,
  );
  const offerCancellation =
    canScheduleCancellation(subscription) && scheduledResult === undefined;

  return (
    <Card
      aria-labelledby="current-subscription-heading"
      className="shadow-theme-sm"
      data-subscription-status={subscription.status}
      role="region"
    >
      <CardContent className="space-y-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className={eyebrowClass}>Current subscription</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2
                className="text-2xl font-semibold break-words text-gray-900 dark:text-white"
                id="current-subscription-heading"
              >
                {subscription.planName}
              </h2>
              <StatusBadge tone={presentation.tone}>
                {presentation.label}
              </StatusBadge>
            </div>
            <PlanPrice subscription={subscription} />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {presentation.description}
            </p>
          </div>
          {offerCancellation ? (
            <CancelAtPeriodEnd
              onScheduled={setScheduledResult}
              ownerType={ownerType}
              subscription={subscription}
            />
          ) : null}
        </div>

        {scheduledResult ? (
          <Alert onDismiss={dismissResult} variant="success">
            {scheduledResult}
          </Alert>
        ) : null}
        {subscription.lifecycleStatus === "PastDue" ? (
          <Alert variant="warning">
            Your renewal payment has not been settled. Check your billing
            history for the latest payment attempt.
          </Alert>
        ) : null}
        {subscription.cancelAtPeriodEnd && !scheduledResult ? (
          <Alert variant="info">
            {cancellationDate
              ? `Your subscription will not renew. You keep access until ${cancellationDate}.`
              : "Your subscription will not renew. You keep access until the end of your current period."}
          </Alert>
        ) : null}

        <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
          <FactList facts={subscriptionFacts(subscription)} />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Plan changes are not available yet. To switch plans, cancel at period
          end and choose a new plan once your current period has ended.
        </p>
      </CardContent>
    </Card>
  );
}

function CancelAtPeriodEnd({
  onScheduled,
  ownerType,
  subscription,
}: Readonly<{
  onScheduled: (message: string) => void;
  ownerType: BillingAccountOwnerType;
  subscription: GetCurrentSubscriptionQueryResponse;
}>) {
  const cancel = useCancelSubscriptionAtPeriodEnd();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const active = useRef(false);
  const periodEnd = formatBillingDate(subscription.currentPeriodEndUtc);
  const dismissError = useCallback(() => setError(undefined), []);

  async function confirm() {
    if (active.current) return;
    active.current = true;
    setError(undefined);
    try {
      const response = await cancel.mutateAsync({
        billingAccountOwnerType: ownerType,
      });
      setConfirming(false);
      onScheduled(describeCancellationResult(response));
    } catch (caught) {
      setError(describeCancellationError(caught));
    } finally {
      active.current = false;
    }
  }

  return (
    <div className="flex shrink-0 flex-col gap-3 lg:items-end">
      <button
        className={`${secondaryButtonClass} min-h-12 rounded-xl px-6 text-base`}
        disabled={cancel.isPending}
        onClick={() => setConfirming(true)}
        type="button"
      >
        Cancel at period end
      </button>
      {error && !confirming ? (
        <Alert onDismiss={dismissError} variant="error">
          {error}
        </Alert>
      ) : null}
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
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:outline-none disabled:opacity-60"
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

/**
 * A purchase awaiting payment confirmation. New purchases are not offered: the
 * backend reserves the entitlement and would reject a conflicting checkout.
 * The status link uses this browser's remembered attempt only as navigation.
 */
export function PendingSubscriptionCard({
  attempt,
  onRefresh,
  refreshing,
  subscription,
  supportEmail,
}: Readonly<{
  attempt: CheckoutAttempt | null | undefined;
  onRefresh: () => void;
  refreshing: boolean;
  subscription: GetCurrentSubscriptionQueryResponse;
  supportEmail?: string | undefined;
}>) {
  const presentation = describeSubscription(subscription);
  const purchaseId =
    attempt?.purchaseId &&
    attempt.planId === subscription.planId &&
    !attempt.settledAtUtc
      ? attempt.purchaseId
      : undefined;

  return (
    <Card
      aria-labelledby="current-subscription-heading"
      className="shadow-theme-sm"
      data-subscription-status={subscription.status}
      role="region"
    >
      <CardContent className="space-y-6 sm:p-8">
        <div className="min-w-0">
          <p className={eyebrowClass}>Subscription purchase</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2
              className="text-2xl font-semibold break-words text-gray-900 dark:text-white"
              id="current-subscription-heading"
            >
              {subscription.planName}
            </h2>
            <StatusBadge tone={presentation.tone}>
              {presentation.label}
            </StatusBadge>
          </div>
          <PlanPrice subscription={subscription} />
        </div>
        <Alert variant="info">
          We are waiting for your payment provider to confirm this purchase.
          Your subscription activates automatically once payment is confirmed,
          so there is no need to start another checkout.
        </Alert>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {purchaseId ? (
            <Link
              className={`${primaryButtonClass} min-h-12 rounded-xl px-6 text-base`}
              href={billingRoutes.purchase(purchaseId)}
            >
              View payment status
            </Link>
          ) : null}
          <button
            className={`${secondaryButtonClass} min-h-12 rounded-xl px-6 text-base`}
            disabled={refreshing}
            onClick={onRefresh}
            type="button"
          >
            {refreshing ? "Checking…" : "Check again"}
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          If this stays pending after you have paid,{" "}
          {supportEmail ? (
            <a
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
              href={`mailto:${supportEmail}`}
            >
              contact support
            </a>
          ) : (
            "contact support"
          )}{" "}
          with your payment reference from the billing history.
        </p>
      </CardContent>
    </Card>
  );
}
