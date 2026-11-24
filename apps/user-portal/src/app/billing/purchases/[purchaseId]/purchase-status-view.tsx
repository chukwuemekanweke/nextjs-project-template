"use client";

import { isApiError } from "@template/api-client";
import type { GetSubscriptionPurchaseStatusQueryResponse } from "@template/api-client/subscriptions";
import { useSubscriptionPurchaseStatus } from "@template/api-react/subscriptions";
import {
  Alert,
  Card,
  CardContent,
  CardTitle,
  Skeleton,
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

  // A settled purchase ends its attempt: a new checkout gets a new key.
  useEffect(() => {
    if (settled) browserCheckoutAttemptStore().markSettled(purchaseId);
  }, [purchaseId, settled]);

  if (status.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading purchase status" role="status">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!status.data) {
    const missing = isApiError(status.error) && status.error.status === 404;
    return (
      <Card>
        <CardContent className="space-y-4">
          <Alert variant="error">
            {missing
              ? "We could not find this purchase for your account."
              : "We could not check this purchase right now. Your payment is not affected."}
          </Alert>
          <div className="flex flex-col gap-3 sm:flex-row">
            {missing ? null : (
              <button
                className={primaryButtonClass}
                disabled={status.isFetching}
                onClick={() => void status.refetch()}
                type="button"
              >
                {status.isFetching ? "Checking…" : "Try again"}
              </button>
            )}
            <Link
              className={secondaryButtonClass}
              href={billingRoutes.overview}
            >
              Go to billing
            </Link>
          </div>
        </CardContent>
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

  return (
    <Card>
      <CardContent className="space-y-6">
        <div
          aria-live="polite"
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <CardTitle>{presentation.title}</CardTitle>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {presentation.description}
            </p>
          </div>
          <StatusBadge tone={presentation.tone}>
            {polling ? "Updating…" : presentation.title}
          </StatusBadge>
        </div>

        {pollingExhausted ? (
          <Alert variant="warning">
            This is taking longer than usual. Your payment may still be
            processing — this does not mean it failed. Check again in a moment.
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

        <div className="flex flex-col gap-3 sm:flex-row">
          {manualRefresh || refreshFailed ? (
            <button
              className={primaryButtonClass}
              disabled={isFetching}
              onClick={onRefresh}
              type="button"
            >
              {isFetching ? "Checking…" : "Check again"}
            </button>
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
        </div>
      </CardContent>
    </Card>
  );
}

function optionalDetail(label: string, value: string | undefined) {
  return value ? [{ label, value }] : [];
}
