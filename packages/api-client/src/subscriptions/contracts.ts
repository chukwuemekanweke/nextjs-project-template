/**
 * Wire contracts owned by the customer-facing subscriptions domain.
 *
 * Monetary values (`price`, `amount`) are authoritative whole minor currency
 * units exactly as returned by the backend. They are never converted here;
 * presentation code formats them.
 *
 * Enumerated string fields are typed as `string` on responses because the
 * backend may add values. The exported literal lists describe the documented
 * values for presentation code to narrow against.
 */

/** Billing-account ownership; the backend derives the account from the actor. */
export type BillingAccountOwnerType = "Stakeholder" | "Tenant";
export const billingAccountOwnerTypes = [
  "Stakeholder",
  "Tenant",
] as const satisfies ReadonlyArray<BillingAccountOwnerType>;

export const subscriptionBillingIntervals = ["Monthly", "Yearly"] as const;
export type SubscriptionBillingInterval =
  (typeof subscriptionBillingIntervals)[number];

export const subscriptionPaymentMethodTypes = [
  "PaymentLink",
  "BankTransfer",
  "Card",
] as const;
export type SubscriptionPaymentMethodType =
  (typeof subscriptionPaymentMethodTypes)[number];

/** Normalized, presentation-safe purchase statuses documented by the backend. */
export const subscriptionPurchaseStatuses = [
  "PurchaseInitiated",
  "PaymentPending",
  "PaymentSucceededFulfillmentPending",
  "SubscriptionActive",
  "SubscriptionScheduled",
  "PaymentFailed",
  "PaymentCancelled",
  "PaymentExpired",
  "PaymentUnderpaid",
  "SubscriptionCancelled",
  "SubscriptionExpired",
  "FulfillmentBlocked",
] as const;
export type SubscriptionPurchaseStatus =
  (typeof subscriptionPurchaseStatuses)[number];

export const subscriptionLifecycleStatuses = [
  "Pending",
  "Active",
  "PastDue",
  "Scheduled",
  "Cancelled",
  "Expired",
] as const;
export type SubscriptionLifecycleStatus =
  (typeof subscriptionLifecycleStatuses)[number];

/** Query parameters shared by owner-scoped routes. */
export type SubscriptionOwnerQueryParams = {
  BillingAccountOwnerType: BillingAccountOwnerType;
};

/** One offered billing interval of a plan and its authoritative price. */
export type SubscriptionPlanPriceResponse = {
  billingInterval: string;
  /** Whole minor currency units. */
  price: number | string;
};

/**
 * A subscription package priced in one currency. A plan offers one price per
 * billing interval in `prices`, so monthly and yearly options are the same
 * plan. Read prices through `subscriptionPlanPrices`, which also accepts the
 * legacy single-interval shape.
 */
export type SubscriptionPlanResponse = {
  code: string;
  currencyCode: string;
  currencyId: string;
  id: string;
  name: string;
  /** Offered intervals, ordered by the backend. */
  prices?: Array<SubscriptionPlanPriceResponse>;
  /** @deprecated Legacy single-interval field; use `prices`. */
  billingInterval?: string;
  /** @deprecated Legacy single-interval field (minor units); use `prices`. */
  price?: number | string;
  /**
   * Optional presentation fields. They never affect price, currency,
   * interval, or entitlement checks.
   */
  /** Short marketing description. */
  description?: string | null;
  /** Ordered list of plan highlights. */
  features?: Array<string> | null;
  /** Short tier label shown as a pill, for example "Starter". */
  badge?: string | null;
  /** Product-configured recommendation ("Most popular"). */
  recommended?: boolean | null;
};
export type ListSubscriptionPlansQueryResponse =
  Array<SubscriptionPlanResponse>;

export type ListEligiblePaymentProvidersPathParams = { planId: string };
export type ListEligiblePaymentProvidersQueryParams =
  SubscriptionOwnerQueryParams;
export type EligiblePaymentProviderResponse = {
  id: string;
  name: string;
  paymentMethodType: string;
  /** Recurring-charge capability; separate from initial-checkout eligibility. */
  supportsRecurringPayments: boolean;
};
export type ListEligiblePaymentProvidersQueryResponse =
  Array<EligiblePaymentProviderResponse>;

export type PurchaseSubscriptionMutationRequest = {
  autoRenew: boolean;
  billingAccountOwnerType: BillingAccountOwnerType;
  /** One of the plan's offered intervals (`Monthly` or `Yearly`). */
  billingInterval: string;
  paymentProviderId: string;
  planId: string;
};

/**
 * Provider instruction fields. Documented keys are listed; adapters may return
 * others. Only `paymentLink` may be used for navigation.
 */
export type SubscriptionPaymentInstructionFields = Readonly<
  Record<string, string>
> & {
  readonly accountName?: string;
  readonly accountNumber?: string;
  readonly bankName?: string;
  readonly merchantReference?: string;
  readonly paymentLink?: string;
  readonly providerReference?: string;
};

export type PurchaseSubscriptionMutationResponse = {
  expiresAtUtc: string | null;
  instructionFields: SubscriptionPaymentInstructionFields;
  merchantReference: string;
  paymentMethodType: string;
  paymentProviderId: string;
  paymentProviderName: string;
  paymentStatus: string;
  purchaseId: string;
  subscriptionId: string;
};

export type GetSubscriptionPurchaseStatusPathParams = { purchaseId: string };
export type GetSubscriptionPurchaseStatusQueryParams =
  SubscriptionOwnerQueryParams;
export type GetSubscriptionPurchaseStatusQueryResponse = {
  /** Whole minor currency units. */
  amount: number | string;
  currencyCode: string;
  currentPeriodEndUtc: string | null;
  fulfilledAtUtc: string | null;
  fulfillmentBlockedAtUtc: string | null;
  fulfillmentBlockedReason: string | null;
  /** `Pending`, `Fulfilled`, or `Blocked`. */
  fulfillmentStatus: string;
  isTerminal: boolean;
  merchantReference: string;
  paymentCompletedAtUtc: string | null;
  paymentExpiresAtUtc: string | null;
  paymentMethodType: string;
  paymentProviderName: string;
  /** Raw payment status. */
  paymentStatus: string;
  purchaseId: string;
  shouldContinuePolling: boolean;
  /** Normalized presentation status; see `subscriptionPurchaseStatuses`. */
  status: string;
  subscriptionId: string;
  /** Raw subscription status. */
  subscriptionStatus: string;
};

export type GetCurrentSubscriptionQueryParams = SubscriptionOwnerQueryParams;
export type GetCurrentSubscriptionQueryResponse = {
  autoRenew: boolean;
  billingAccountId: string;
  billingInterval: string;
  cancelAtPeriodEnd: boolean;
  cancellationEffectiveAtUtc: string | null;
  cancellationRequestedAtUtc: string | null;
  currencyCode: string;
  currencyId: string;
  /** End of the current entitlement period. */
  currentPeriodEndUtc: string | null;
  currentPeriodStartUtc: string | null;
  id: string;
  /** Presentation-safe status; see `subscriptionLifecycleStatuses`. */
  lifecycleStatus: string;
  /** Next scheduled charge attempt; not the entitlement boundary. */
  nextBillingAtUtc: string | null;
  planCode: string;
  planId: string;
  planName: string;
  /** Whole minor currency units. */
  planPrice: number | string;
  /** Raw domain status. */
  status: string;
};

export type CancelSubscriptionAtPeriodEndMutationRequest = {
  billingAccountOwnerType: BillingAccountOwnerType;
};
export type CancelSubscriptionAtPeriodEndMutationResponse = {
  changed: boolean;
  entitledUntilUtc: string | null;
  found: boolean;
};

export type GetBillingHistoryQueryParams = SubscriptionOwnerQueryParams & {
  Page?: number;
  /** 1..100; the backend defaults to 20. */
  PageSize?: number;
};
export type BillingHistoryItemResponse = {
  /** Whole minor currency units. */
  amount: number | string;
  billingPeriodEndUtc: string | null;
  billingPeriodStartUtc: string | null;
  createdAtUtc: string;
  currencyCode: string;
  merchantReference: string;
  paidAtUtc: string | null;
  paymentProviderName: string;
  paymentStatus: string;
  paymentTransactionId: string;
  planCode: string;
  planName: string;
  subscriptionId: string;
};
export type GetBillingHistoryQueryResponse = {
  items: Array<BillingHistoryItemResponse>;
  page: number;
  pageSize: number;
  totalCount: number;
};

export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

export const subscriptionsOperations = {
  cancelSubscriptionAtPeriodEnd: {
    method: "POST",
    path: "/api/v1/subscriptions/current/cancellation-at-period-end",
  },
  getBillingHistory: {
    method: "GET",
    path: "/api/v1/subscriptions/billing-history",
  },
  getCurrentSubscription: {
    method: "GET",
    path: "/api/v1/subscriptions/current",
  },
  getSubscriptionPurchaseStatus: {
    method: "GET",
    path: "/api/v1/subscriptions/purchases/{purchaseId}",
  },
  listEligiblePaymentProviders: {
    method: "GET",
    path: "/api/v1/subscription-plans/{planId}/payment-providers",
  },
  listSubscriptionPlans: {
    method: "GET",
    path: "/api/v1/subscription-plans",
  },
  purchaseSubscription: {
    method: "POST",
    path: "/api/v1/subscriptions/purchases",
  },
} as const;
