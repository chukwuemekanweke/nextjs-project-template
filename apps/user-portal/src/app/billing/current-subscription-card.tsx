"use client";

import type {
  BillingAccountOwnerType,
  GetCurrentSubscriptionQueryResponse,
} from "@template/api-client/subscriptions";
import { useCancelSubscriptionAtPeriodEnd } from "@template/api-react/subscriptions";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  CreditCardIcon,
  IconTile,
  Modal,
  Progress,
  RefreshIcon,
  buttonVariants,
} from "@template/ui-core";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { billingRoutes } from "@/config/billing";
import {
  billingIntervalName,
  canScheduleCancellation,
  describeCancellationError,
  describeCancellationResult,
  describeSubscription,
  formatBillingDate,
} from "@/lib/billing-display";
import {
  billingPeriodProgress,
  formatBillingPeriod,
  subscriptionSummary,
} from "@/lib/billing-presentation";
import type { CheckoutAttempt } from "@/lib/checkout-attempt";
import { StatusBadge } from "./billing-ui";

type Fact = Readonly<{ label: string; value: string }>;

/** Backend dates only; nothing is derived from the billing interval. */
export function subscriptionFacts(
  subscription: GetCurrentSubscriptionQueryResponse,
): Fact[] {
  const renewing = subscription.autoRenew && !subscription.cancelAtPeriodEnd;
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
    ...(nextBilling
      ? [{ label: "Next billing date", value: nextBilling }]
      : []),
    { label: "Auto-renewal", value: renewing ? "Enabled" : "Off" },
    ...(subscription.cancelAtPeriodEnd
      ? [
          {
            label: "Cancellation effective",
            value: cancellationEffective ?? "—",
          },
          ...(cancellationRequested
            ? [
                {
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
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((fact) => (
        <div className="min-w-0" key={fact.label}>
          <dt className="text-small text-fg-subtle">{fact.label}</dt>
          <dd className="text-fg font-medium break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Current-period line with a decorative progress bar (reference
 * `.progress`). The bar needs the clock, so it renders after hydration (or
 * from `now` in tests); the period text is always present.
 */
function CurrentPeriod({
  now,
  subscription,
}: Readonly<{
  now?: number | undefined;
  subscription: GetCurrentSubscriptionQueryResponse;
}>) {
  const [clock, setClock] = useState(now);
  useEffect(() => {
    if (now !== undefined) return;
    // Read the clock after hydration so server and client markup match.
    const timer = window.setTimeout(() => setClock(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, [now]);
  const period = formatBillingPeriod(
    subscription.currentPeriodStartUtc,
    subscription.currentPeriodEndUtc,
  );
  if (!period) return null;
  const progress =
    clock === undefined
      ? undefined
      : billingPeriodProgress(
          subscription.currentPeriodStartUtc,
          subscription.currentPeriodEndUtc,
          clock,
        );

  return (
    <div className="mt-4 max-w-md space-y-2">
      <div className="text-small flex flex-wrap items-center justify-between gap-x-4">
        <span className="text-fg-muted">Current period</span>
        <span className="text-fg font-medium">{period}</span>
      </div>
      {progress ? (
        <Progress
          label="Current billing period"
          value={progress.percent}
          valueText={progress.valueText}
        />
      ) : null}
    </div>
  );
}

function PlanHeading({
  subscription,
}: Readonly<{ subscription: GetCurrentSubscriptionQueryResponse }>) {
  const presentation = describeSubscription(subscription);
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <h2
        className="text-h2 text-fg break-words"
        id="current-subscription-heading"
      >
        {subscription.planName}
      </h2>
      <StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge>
      {subscription.billingInterval ? (
        <Chip>{billingIntervalName(subscription.billingInterval)}</Chip>
      ) : null}
    </div>
  );
}

/**
 * The customer's current entitlement (Active, PastDue, cancellation
 * scheduled, Scheduled, or unknown) with period-end cancellation, the only
 * plan action the backend supports. Upgrades, downgrades, "Keep subscription"
 * (resume) and "Pay now" are intentionally not offered (DR-055).
 */
export function CurrentSubscriptionCard({
  now,
  ownerType,
  subscription,
}: Readonly<{
  /** Clock for the period bar; tests pass a fixed value. */
  now?: number;
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
      data-subscription-status={subscription.status}
      role="region"
    >
      <CardHeader>
        <CardTitle as="h3">Current subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <IconTile className="max-sm:hidden" size="lg">
              <CreditCardIcon />
            </IconTile>
            <div className="min-w-0 flex-1">
              <PlanHeading subscription={subscription} />
              <p className="text-fg-muted mt-1.5">
                {subscriptionSummary(subscription)}
              </p>
              <p className="sr-only">{presentation.description}</p>
              <CurrentPeriod now={now} subscription={subscription} />
            </div>
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
          <Alert title="Renewal payment not settled." variant="error">
            Your renewal payment has not been settled. Check your billing
            history for the latest payment attempt.
          </Alert>
        ) : null}
        {subscription.cancelAtPeriodEnd && !scheduledResult ? (
          <Alert variant="warning">
            {cancellationDate
              ? `Your subscription will not renew. You keep access until ${cancellationDate}.`
              : "Your subscription will not renew. You keep access until the end of your current period."}
          </Alert>
        ) : null}

        <div className="border-border border-t pt-5">
          <FactList facts={subscriptionFacts(subscription)} />
        </div>

        <p className="text-small text-fg-subtle">
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
      <Button
        disabled={cancel.isPending}
        onClick={() => setConfirming(true)}
        variant="dangerOutline"
      >
        Cancel at period end
      </Button>
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
            <Button
              disabled={cancel.isPending}
              onClick={() => setConfirming(false)}
              variant="secondary"
            >
              Keep subscription
            </Button>
            <Button
              loading={cancel.isPending}
              onClick={() => void confirm()}
              variant="danger"
            >
              {cancel.isPending ? "Cancelling…" : "Cancel at period end"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * A purchase awaiting payment confirmation. New purchases are not offered: the
 * backend reserves the entitlement and would reject a conflicting checkout.
 * The status link uses this browser's remembered attempt only as navigation;
 * "Resume payment" from the reference is not offered (no backend operation).
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
  const purchaseId =
    attempt?.purchaseId &&
    attempt.planId === subscription.planId &&
    !attempt.settledAtUtc
      ? attempt.purchaseId
      : undefined;

  return (
    <Card
      aria-labelledby="current-subscription-heading"
      data-subscription-status={subscription.status}
      role="region"
    >
      <CardHeader>
        <CardTitle as="h3">Subscription purchase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <IconTile className="max-sm:hidden" size="lg" tone="warning">
              <CreditCardIcon />
            </IconTile>
            <div className="min-w-0 flex-1">
              <PlanHeading subscription={subscription} />
              <p className="text-fg-muted mt-1.5">
                We are waiting for your payment provider to confirm this
                purchase. Your subscription activates automatically once payment
                is confirmed, so there is no need to start another checkout.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              leadingIcon={<RefreshIcon />}
              loading={refreshing}
              onClick={onRefresh}
              variant="secondary"
            >
              {refreshing ? "Checking…" : "Check again"}
            </Button>
            {purchaseId ? (
              <Link
                className={buttonVariants({ variant: "primary" })}
                href={billingRoutes.purchase(purchaseId)}
              >
                View payment status
              </Link>
            ) : null}
          </div>
        </div>
        <p className="text-small text-fg-subtle">
          If this stays pending after you have paid,{" "}
          {supportEmail ? (
            <a
              className="text-brand-ink font-medium hover:underline"
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
