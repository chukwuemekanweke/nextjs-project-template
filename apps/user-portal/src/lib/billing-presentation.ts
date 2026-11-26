import type {
  EligiblePaymentProviderResponse,
  GetCurrentSubscriptionQueryResponse,
  GetSubscriptionPurchaseStatusQueryResponse,
} from "@template/api-client/subscriptions";
import { formatMinorUnits } from "@template/ui-core";
import {
  billingCadence,
  formatBillingDate,
  formatBillingDateTime,
  isPortalSupportedPaymentMethod,
  paymentMethodLabel,
} from "./billing-display";

/*
 * Pure presentation mappings for the redesigned billing screens (FE-UI-010).
 * Inputs are backend responses only. Nothing here decides entitlement,
 * eligibility or purchase state; it only words and arranges backend facts.
 */

/** "Nov 23, 2026 – Dec 23, 2026" from backend period boundaries only. */
export function formatBillingPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  options: { timeZone?: string } = {},
): string | undefined {
  const from = formatBillingDate(start, options);
  const to = formatBillingDate(end, options);
  return from && to ? `${from} – ${to}` : undefined;
}

export type PeriodProgress = Readonly<{ percent: number; valueText: string }>;

/**
 * How far the current period has elapsed, for the decorative period bar.
 * Uses the backend period boundaries and the given clock; returns `undefined`
 * when either boundary is missing or invalid, so no bar is drawn.
 */
export function billingPeriodProgress(
  start: string | null | undefined,
  end: string | null | undefined,
  now: number,
): PeriodProgress | undefined {
  if (!start || !end) return undefined;
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return undefined;
  }
  const ratio = Math.min(Math.max((now - from) / (to - from), 0), 1);
  const percent = Math.round(ratio * 100);
  return { percent, valueText: `${percent}% of the current period elapsed` };
}

/**
 * One-line summary under the plan name. Renewal wording appears only when
 * the backend reports auto-renew on, no cancellation, and a next billing date.
 */
export function subscriptionSummary(
  subscription: Pick<
    GetCurrentSubscriptionQueryResponse,
    | "autoRenew"
    | "billingInterval"
    | "cancelAtPeriodEnd"
    | "cancellationEffectiveAtUtc"
    | "currencyCode"
    | "currentPeriodEndUtc"
    | "nextBillingAtUtc"
    | "planPrice"
  >,
): string {
  const price = `${formatMinorUnits(subscription.planPrice, subscription.currencyCode)} per ${billingCadence(subscription.billingInterval)}`;
  if (subscription.cancelAtPeriodEnd) {
    const until = formatBillingDate(
      subscription.cancellationEffectiveAtUtc ??
        subscription.currentPeriodEndUtc,
    );
    return until
      ? `Auto-renew is off. You keep access until ${until}, then the subscription ends.`
      : "Auto-renew is off. You keep access until the end of the current period.";
  }
  const nextBilling = subscription.autoRenew
    ? formatBillingDate(subscription.nextBillingAtUtc)
    : undefined;
  if (nextBilling) return `${price} · renews automatically on ${nextBilling}.`;
  if (subscription.autoRenew) return `${price} · renews automatically.`;
  return `${price} · auto-renew is off.`;
}

/** Second line of a payment-method radio card, from provider capabilities. */
export function paymentProviderDescription(
  provider: Pick<
    EligiblePaymentProviderResponse,
    "paymentMethodType" | "supportsRecurringPayments"
  >,
): string {
  const method = paymentMethodLabel(provider.paymentMethodType);
  if (!isPortalSupportedPaymentMethod(provider.paymentMethodType)) {
    return `${method} is not available in this portal yet`;
  }
  return provider.supportsRecurringPayments
    ? `${method} · supports auto-renew`
    : method;
}

/**
 * What happens after "Pay", for the selected provider only. Hosted checkouts
 * redirect; bank transfers show details. Nothing is said about other methods.
 */
export function checkoutNextStepDisclosure(
  provider:
    | Pick<EligiblePaymentProviderResponse, "name" | "paymentMethodType">
    | undefined,
): string | undefined {
  if (provider?.paymentMethodType === "PaymentLink") {
    return `You'll be redirected to ${provider.name} to complete payment securely.`;
  }
  if (provider?.paymentMethodType === "BankTransfer") {
    return `You'll get ${provider.name} bank transfer details on the next step.`;
  }
  return undefined;
}

export type PurchaseTimelineEvent = Readonly<{
  at: string;
  id: "blocked" | "fulfilled" | "paid";
  label: string;
  timestamp: number;
}>;

/**
 * Purchase events the backend actually recorded, newest first. The status
 * response carries completion, activation and blocking timestamps only, so
 * the timeline never shows creation, redirect or other invented events.
 */
export function purchaseTimeline(
  data: Pick<
    GetSubscriptionPurchaseStatusQueryResponse,
    | "fulfilledAtUtc"
    | "fulfillmentBlockedAtUtc"
    | "paymentCompletedAtUtc"
    | "paymentProviderName"
  >,
  options: { timeZone?: string } = {},
): PurchaseTimelineEvent[] {
  const candidates: Array<
    [PurchaseTimelineEvent["id"], string | null, string]
  > = [
    ["fulfilled", data.fulfilledAtUtc, "Subscription activated"],
    ["blocked", data.fulfillmentBlockedAtUtc, "Activation needs attention"],
    [
      "paid",
      data.paymentCompletedAtUtc,
      `Payment confirmed by ${data.paymentProviderName}`,
    ],
  ];
  return candidates
    .flatMap(([id, value, label]) => {
      const at = formatBillingDateTime(value, options);
      const timestamp = value ? Date.parse(value) : Number.NaN;
      return at && Number.isFinite(timestamp)
        ? [{ at, id, label, timestamp }]
        : [];
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}
