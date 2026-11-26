import type {
  BillingHistoryItemResponse,
  EligiblePaymentProviderResponse,
  GetCurrentSubscriptionQueryResponse,
  GetSubscriptionPurchaseStatusQueryResponse,
} from "@template/api-client/subscriptions";

/*
 * PREVIEW AND TEST ONLY. Typed billing states that the reference artboards
 * (`UserBilling-{active,cancelling,expired,none,pastdue,pending}`,
 * `UserPurchaseDetail`) show but the live `GET /subscriptions/current`
 * endpoint does not return today (it returns Pending/Active, and `404` once a
 * subscription ends). Tests use them to prove the real components render
 * every design state safely. Production modules must never import this
 * file, use it as a fallback for a failed request, or expose it behind a
 * toggle; `billing-states.test.tsx` enforces the import rule.
 */

/** Fixed clock for the period bar: halfway through the sample period. */
export const FIXTURE_NOW = Date.parse("2026-11-29T12:00:00Z");

const baseSubscription: GetCurrentSubscriptionQueryResponse = {
  autoRenew: true,
  billingAccountId: "fixture-account",
  billingInterval: "Monthly",
  cancelAtPeriodEnd: false,
  cancellationEffectiveAtUtc: null,
  cancellationRequestedAtUtc: null,
  currencyCode: "NGN",
  currencyId: "fixture-currency",
  currentPeriodEndUtc: "2026-12-14T12:00:00Z",
  currentPeriodStartUtc: "2026-11-14T12:00:00Z",
  id: "fixture-subscription",
  lifecycleStatus: "Active",
  nextBillingAtUtc: "2026-12-14T12:00:00Z",
  planCode: "STANDARD",
  planId: "00000000-0000-4000-8000-0000000000aa",
  planName: "Standard",
  planPrice: 1500000,
  status: "Active",
};

export const subscriptionFixtures = {
  active: baseSubscription,
  cancelling: {
    ...baseSubscription,
    autoRenew: false,
    cancelAtPeriodEnd: true,
    cancellationEffectiveAtUtc: "2026-12-14T12:00:00Z",
    cancellationRequestedAtUtc: "2026-11-20T09:30:00Z",
    nextBillingAtUtc: null,
  },
  expired: {
    ...baseSubscription,
    autoRenew: false,
    currentPeriodEndUtc: "2026-11-14T12:00:00Z",
    currentPeriodStartUtc: "2026-10-14T12:00:00Z",
    lifecycleStatus: "Expired",
    nextBillingAtUtc: null,
    status: "Expired",
  },
  pastDue: {
    ...baseSubscription,
    lifecycleStatus: "PastDue",
  },
  pending: {
    ...baseSubscription,
    currentPeriodEndUtc: null,
    currentPeriodStartUtc: null,
    lifecycleStatus: "Pending",
    nextBillingAtUtc: null,
    status: "Pending",
  },
  unknown: {
    ...baseSubscription,
    lifecycleStatus: "Paused",
    status: "Paused",
  },
} as const satisfies Record<string, GetCurrentSubscriptionQueryResponse>;

export const historyFixtures: readonly BillingHistoryItemResponse[] = [
  {
    amount: 1500000,
    billingPeriodEndUtc: "2026-12-14T12:00:00Z",
    billingPeriodStartUtc: "2026-11-14T12:00:00Z",
    createdAtUtc: "2026-11-14T09:58:00Z",
    currencyCode: "NGN",
    merchantReference: "BCH_8812309912",
    paidAtUtc: "2026-11-14T10:01:00Z",
    paymentProviderName: "Bachs",
    paymentStatus: "Succeeded",
    paymentTransactionId: "fixture-tx-1",
    planCode: "STANDARD",
    planName: "Standard",
    subscriptionId: "fixture-subscription",
  },
  {
    amount: 1500000,
    billingPeriodEndUtc: "2026-10-14T12:00:00Z",
    billingPeriodStartUtc: "2026-09-14T12:00:00Z",
    createdAtUtc: "2026-09-14T09:00:00Z",
    currencyCode: "NGN",
    merchantReference: "CRD_44120",
    paidAtUtc: null,
    paymentProviderName: "Credo",
    paymentStatus: "Failed",
    paymentTransactionId: "fixture-tx-2",
    planCode: "STANDARD",
    planName: "Standard",
    subscriptionId: "fixture-subscription",
  },
];

export const providerFixtures = {
  bankTransfer: {
    id: "fixture-provider-bank",
    name: "SafeHaven",
    paymentMethodType: "BankTransfer",
    supportsRecurringPayments: false,
  },
  card: {
    id: "fixture-provider-card",
    name: "Credo",
    paymentMethodType: "Card",
    supportsRecurringPayments: true,
  },
  hosted: {
    id: "fixture-provider-hosted",
    name: "Bachs",
    paymentMethodType: "PaymentLink",
    supportsRecurringPayments: true,
  },
} as const satisfies Record<string, EligiblePaymentProviderResponse>;

/** A fulfilled purchase with every recorded timestamp the contract carries. */
export const fulfilledPurchaseFixture: GetSubscriptionPurchaseStatusQueryResponse =
  {
    amount: 1500000,
    currencyCode: "NGN",
    currentPeriodEndUtc: "2026-12-14T12:00:00Z",
    fulfilledAtUtc: "2026-11-14T10:02:00Z",
    fulfillmentBlockedAtUtc: null,
    fulfillmentBlockedReason: null,
    fulfillmentStatus: "Fulfilled",
    isTerminal: true,
    merchantReference: "BCH_8812309912",
    paymentCompletedAtUtc: "2026-11-14T10:01:00Z",
    paymentExpiresAtUtc: null,
    paymentMethodType: "PaymentLink",
    paymentProviderName: "Bachs",
    paymentStatus: "Succeeded",
    purchaseId: "00000000-0000-4000-8000-0000000000bb",
    shouldContinuePolling: false,
    status: "SubscriptionActive",
    subscriptionId: "fixture-subscription",
    subscriptionStatus: "Active",
  };
