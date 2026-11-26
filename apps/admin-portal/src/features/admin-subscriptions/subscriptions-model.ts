import type {
  BillingAccountOwnerType,
  SubscriptionLifecycleStatus,
} from "@template/api-client/subscriptions";
import type { StatusPresentation } from "../admin-billing-shared/billing-model";
import type { BillingTimelineEvent } from "../admin-billing-shared/billing-sections";

/*
 * Admin subscriptions view model (ADM-SUBSCRIPTIONS,
 * ADM-SUBSCRIPTION-DETAIL). Local presentation types: there is no admin
 * subscriptions contract (DR-070) and the customer `getCurrentSubscription`
 * read is owner-scoped, not an admin inventory. Statuses use the documented
 * `subscriptionLifecycleStatuses`; owner and tenant come only from the
 * source and are never derived from each other. A future adapter
 * (CAF-FE-016) maps the admin API into these types.
 */

export type AdminSubscriptionRow = Readonly<{
  id: string;
  ownerType: BillingAccountOwnerType;
  ownerId: string | null;
  /** Display name as returned; `null` renders "Not available". */
  ownerDisplayName: string | null;
  /** Secondary owner line (for example an email), only when returned. */
  ownerSecondary: string | null;
  /** Tenant as returned by the source, never inferred from the owner. */
  tenantName: string | null;
  planName: string;
  planCode: string;
  /** Documented lifecycle status (`SubscriptionLifecycleStatus`) or a new one. */
  lifecycleStatus: SubscriptionLifecycleStatus | (string & {});
  cancelAtPeriodEnd: boolean;
  currentPeriodEndUtc: string | null;
  nextBillingAtUtc: string | null;
  /** `null` when the source does not report renewal. */
  autoRenew: boolean | null;
}>;

/** One payment linked to the subscription (reference "Renewals & payments"). */
export type AdminSubscriptionPayment = Readonly<{
  id: string;
  createdAtUtc: string;
  /** For example `Purchase` or `Renewal`, as returned. */
  kind: string;
  merchantReference: string;
  paymentStatus: string;
  amount: number | string;
  currencyCode: string;
}>;

export type AdminSubscriptionSource =
  | Readonly<{ kind: "purchase"; providerName: string | null }>
  | Readonly<{ kind: "allocation" }>;

export type AdminSubscriptionDetail = AdminSubscriptionRow &
  Readonly<{
    billingInterval: string | null;
    /** Recurring amount in minor units, as returned. */
    planPrice: number | string | null;
    currencyCode: string | null;
    currentPeriodStartUtc: string | null;
    startedAtUtc: string | null;
    source: AdminSubscriptionSource | null;
    /** Display text for a saved payment method, only when returned. */
    savedPaymentMethod: string | null;
    /** `Pending`, `Fulfilled` or `Blocked` as returned; `null` if unknown. */
    fulfillmentStatus: string | null;
    /** Totals reported by the backend; never summed by the frontend. */
    lifetimePaid: Readonly<{
      amount: number | string;
      currencyCode: string;
      paymentCount: number;
    }> | null;
    statusHistory: readonly BillingTimelineEvent[] | null;
    payments: readonly AdminSubscriptionPayment[] | null;
  }>;

/* ------------------------------------------------------------------------ */
/* Presentation                                                              */
/* ------------------------------------------------------------------------ */

const LIFECYCLE_STATUSES: Readonly<Record<string, StatusPresentation>> = {
  Active: { label: "Active", tone: "success" },
  Cancelled: { label: "Cancelled", tone: "neutral" },
  Expired: { label: "Expired", tone: "neutral" },
  PastDue: { label: "Past due", tone: "danger" },
  Pending: { label: "Pending", tone: "info" },
  Scheduled: { label: "Scheduled", tone: "info" },
};

export function describeSubscriptionStatus(
  subscription: Pick<
    AdminSubscriptionRow,
    "lifecycleStatus" | "cancelAtPeriodEnd"
  >,
): StatusPresentation {
  if (
    subscription.cancelAtPeriodEnd &&
    (subscription.lifecycleStatus === "Active" ||
      subscription.lifecycleStatus === "PastDue")
  ) {
    return { label: "Cancels at period end", tone: "warning" };
  }
  return (
    LIFECYCLE_STATUSES[subscription.lifecycleStatus] ?? {
      label: subscription.lifecycleStatus,
      tone: "neutral",
    }
  );
}

export function ownerTypeLabel(ownerType: BillingAccountOwnerType): string {
  return ownerType === "Stakeholder" ? "User" : "Tenant";
}

export function autoRenewLabel(autoRenew: boolean | null): string | null {
  if (autoRenew === null) return null;
  return autoRenew ? "On" : "Off";
}

export function subscriptionSourceLabel(
  source: AdminSubscriptionSource | null,
): string | null {
  if (!source) return null;
  if (source.kind === "allocation") return "Admin allocation · complimentary";
  return source.providerName
    ? `Paid purchase · ${source.providerName}`
    : "Paid purchase";
}

/* ------------------------------------------------------------------------ */
/* Actions                                                                   */
/* ------------------------------------------------------------------------ */

export const SUBSCRIPTION_ACTIONS = [
  "retryFulfillment",
  "cancelAtPeriodEnd",
  "cancelNow",
] as const;
export type SubscriptionAction = (typeof SUBSCRIPTION_ACTIONS)[number];

/**
 * Actions the reference offers that make sense for the reported state.
 * Whether the backend allows them is decided by the backend.
 */
export function availableSubscriptionActions(
  subscription: Pick<
    AdminSubscriptionDetail,
    "lifecycleStatus" | "cancelAtPeriodEnd" | "fulfillmentStatus"
  >,
): SubscriptionAction[] {
  const actions: SubscriptionAction[] = [];
  if (subscription.fulfillmentStatus === "Blocked") {
    actions.push("retryFulfillment");
  }
  const running =
    subscription.lifecycleStatus === "Active" ||
    subscription.lifecycleStatus === "PastDue";
  if (running && !subscription.cancelAtPeriodEnd) {
    actions.push("cancelAtPeriodEnd");
  }
  if (running || subscription.lifecycleStatus === "Scheduled") {
    actions.push("cancelNow");
  }
  return actions;
}

export type SubscriptionActionCopy = Readonly<{
  /** Button label on the page. */
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  variant: "secondary" | "danger";
}>;

/**
 * Confirmation copy. Each action has its own wording; none says the action
 * has happened — the page shows the backend's state after it responds.
 */
export function subscriptionActionCopy(
  action: SubscriptionAction,
  subscription: Pick<AdminSubscriptionDetail, "planName" | "ownerDisplayName">,
): SubscriptionActionCopy {
  const owner = subscription.ownerDisplayName ?? "this owner";
  switch (action) {
    case "retryFulfillment":
      return {
        confirmLabel: "Request retry",
        description: `Asks the backend to retry granting ${subscription.planName} to ${owner}. No new payment is taken.`,
        label: "Retry fulfillment",
        title: "Retry fulfillment?",
        tone: "primary",
        variant: "secondary",
      };
    case "cancelAtPeriodEnd":
      return {
        confirmLabel: "Request cancellation at period end",
        description: `${subscription.planName} stays active for ${owner} until the current period ends and then does not renew.`,
        label: "Cancel at period end",
        title: "Cancel at the end of the period?",
        tone: "danger",
        variant: "secondary",
      };
    case "cancelNow":
      return {
        confirmLabel: "Request immediate cancellation",
        description: `${owner} loses ${subscription.planName} access as soon as the backend processes this. Refunds are not part of this action.`,
        label: "Cancel now",
        title: "Cancel immediately?",
        tone: "danger",
        variant: "danger",
      };
  }
}

/* ------------------------------------------------------------------------ */
/* Filters                                                                   */
/* ------------------------------------------------------------------------ */

export const SUBSCRIPTION_SEARCH_MAX_LENGTH = 100;

/** Search plus the four reference filters; `""` means "Any". */
export type AdminSubscriptionFilters = Readonly<{
  query: string;
  status: string;
  plan: string;
  ownerType: "" | BillingAccountOwnerType;
  renewal: "" | "on" | "off";
}>;

export const DEFAULT_SUBSCRIPTION_FILTERS: AdminSubscriptionFilters = {
  ownerType: "",
  plan: "",
  query: "",
  renewal: "",
  status: "",
};

export const subscriptionStatusFilterOptions = Object.entries(
  LIFECYCLE_STATUSES,
).map(([value, { label }]) => ({ label, value }));

export const ownerTypeFilterOptions = [
  { label: "User", value: "Stakeholder" },
  { label: "Tenant", value: "Tenant" },
] as const;

export const renewalFilterOptions = [
  { label: "On", value: "on" },
  { label: "Off", value: "off" },
] as const;

type SearchParamsLike = Readonly<{ get(name: string): string | null }>;

const clean = (value: string | null) =>
  (value ?? "").trim().slice(0, SUBSCRIPTION_SEARCH_MAX_LENGTH);

function oneOf<const T extends string>(
  value: string,
  allowed: readonly { value: T }[],
): T | "" {
  return allowed.find((option) => option.value === value)?.value ?? "";
}

export function parseSubscriptionFilters(
  params: SearchParamsLike,
): AdminSubscriptionFilters {
  return {
    ownerType: oneOf(clean(params.get("owner")), ownerTypeFilterOptions),
    plan: clean(params.get("plan")),
    query: clean(params.get("q")),
    renewal: oneOf(clean(params.get("renewal")), renewalFilterOptions),
    status: oneOf(clean(params.get("status")), subscriptionStatusFilterOptions),
  };
}

export function subscriptionFiltersToSearchParams(
  filters: AdminSubscriptionFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  const entries: [string, string][] = [
    ["q", filters.query],
    ["status", filters.status],
    ["plan", filters.plan],
    ["owner", filters.ownerType],
    ["renewal", filters.renewal],
  ];
  for (const [name, value] of entries) {
    const trimmed = clean(value);
    if (trimmed) params.set(name, trimmed);
  }
  return params;
}

export function hasActiveSubscriptionFilters(
  filters: AdminSubscriptionFilters,
): boolean {
  return subscriptionFiltersToSearchParams(filters).toString() !== "";
}
