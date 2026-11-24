import {
  subscriptionPlanPrices,
  type GetCurrentSubscriptionQueryResponse,
  type SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import type { PlanPresentation } from "@/config/billing";

/**
 * Billing page rendering decisions, centralized so every layout rule is
 * testable without rendering. Inputs are backend responses only; nothing here
 * decides entitlement or purchase eligibility beyond what the backend says.
 */

type CurrentSubscriptionResult = Readonly<{
  data?: GetCurrentSubscriptionQueryResponse | null | undefined;
  error?: unknown;
  isError?: boolean;
  isPending: boolean;
}>;

export type BillingView =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ error: unknown; kind: "error" }>
  /** No current pending/active subscription: offer plans. */
  | Readonly<{ kind: "discovery" }>
  /** A purchase is awaiting payment confirmation; no new purchase is offered. */
  | Readonly<{
      kind: "pending";
      subscription: GetCurrentSubscriptionQueryResponse;
    }>
  /** Active, past-due, cancelling, scheduled, or unrecognized entitlement. */
  | Readonly<{
      kind: "subscription";
      subscription: GetCurrentSubscriptionQueryResponse;
    }>;

/** Lifecycle values after which the backend permits a new purchase. */
const ENDED_LIFECYCLE_STATUSES = new Set(["Cancelled", "Expired"]);

/**
 * Maps the current-subscription query to the main Billing view.
 *
 * - Loading is never treated as "no subscription".
 * - Only the backend `404` (mapped to `null` by the query) means none; network,
 *   authorization, and server errors stay errors.
 * - `GET /subscriptions/current` returns only `Pending`/`Active` today. An
 *   ended subscription, if returned, is not an entitlement, so plans show.
 * - A cancellation scheduled for period end is still an active entitlement.
 * - Unknown lifecycle values are treated as an entitlement, never as
 *   permission to buy again.
 */
export function resolveBillingView(
  current: CurrentSubscriptionResult,
): BillingView {
  if (current.isPending) return { kind: "loading" };
  if (current.isError) return { error: current.error, kind: "error" };
  const subscription = current.data;
  if (!subscription) return { kind: "discovery" };
  if (ENDED_LIFECYCLE_STATUSES.has(subscription.lifecycleStatus)) {
    return { kind: "discovery" };
  }
  if (subscription.lifecycleStatus === "Pending") {
    return { kind: "pending", subscription };
  }
  return { kind: "subscription", subscription };
}

export type PlanLayout = "empty" | "single" | "pair" | "grid";

/** Plan count drives layout only; plans are never filtered or reordered. */
export function resolvePlanLayout(planCount: number): PlanLayout {
  if (planCount <= 0) return "empty";
  if (planCount === 1) return "single";
  if (planCount === 2) return "pair";
  return "grid";
}

/** Plan counts at or above this use the expanded pricing grid. */
export const EXPANDED_PLAN_GRID_THRESHOLD = 3;

export type BillingHistoryState = "error" | "loading" | number;

/**
 * Where billing history appears:
 * - `inline`: the seven-column table on the Billing page.
 * - `link`: a secondary link to `/billing/history` (expanded pricing grid).
 * - `hidden`: nothing, because there is nothing to show yet.
 *
 * `history` is the server `totalCount`, or the query state while unknown.
 * `planCount` is `undefined` while plans load.
 */
export function resolveBillingHistoryPlacement({
  history,
  planCount,
  view,
}: Readonly<{
  history: BillingHistoryState;
  planCount: number | undefined;
  view: BillingView["kind"];
}>): "hidden" | "inline" | "link" {
  if (view === "subscription") return "inline";
  if (view === "loading" || view === "error") return "hidden";
  if (history === "loading" || history === 0) return "hidden";
  if (view === "pending") return "inline";
  if (planCount === undefined) return "hidden";
  // An unknown history (load error) is surfaced where history would appear.
  return planCount >= EXPANDED_PLAN_GRID_THRESHOLD ? "link" : "inline";
}

/**
 * Shortens long merchant references for table layout. The full value is
 * always available through the copy action and the accessible title.
 */
export function abbreviateReference(reference: string, maxLength = 14) {
  if (reference.length <= maxLength) return reference;
  const head = Math.ceil((maxLength - 1) / 2);
  const tail = Math.floor((maxLength - 1) / 2);
  return `${reference.slice(0, head)}…${reference.slice(-tail)}`;
}

/**
 * Every billing interval offered by at least one plan, in first-seen order.
 * Drives the plan-grid interval toggle; nothing is invented.
 */
export function offeredBillingIntervals(
  plans: ReadonlyArray<SubscriptionPlanResponse>,
): string[] {
  const intervals: string[] = [];
  for (const plan of plans) {
    for (const { billingInterval } of subscriptionPlanPrices(plan)) {
      if (!intervals.includes(billingInterval)) intervals.push(billingInterval);
    }
  }
  return intervals;
}

export type ResolvedPlanPresentation = Readonly<{
  badge: string | undefined;
  description: string | undefined;
  features: ReadonlyArray<string>;
  recommended: boolean;
}>;

const present = (value: string | null | undefined) =>
  value?.trim() ? value.trim() : undefined;

/**
 * Card copy for a plan: API fields first, then configuration by plan code,
 * then the placeholder. A recommendation is never assumed.
 */
export function resolvePlanPresentation(
  plan: SubscriptionPlanResponse,
  configured: PlanPresentation | undefined,
  placeholder: PlanPresentation | undefined,
): ResolvedPlanPresentation {
  const apiFeatures = plan.features?.filter((feature) => present(feature));
  return {
    badge:
      present(plan.badge) ??
      present(configured?.badge) ??
      present(placeholder?.badge),
    description:
      present(plan.description) ??
      present(configured?.description) ??
      present(placeholder?.description),
    features: apiFeatures?.length
      ? apiFeatures
      : configured?.features?.length
        ? configured.features
        : (placeholder?.features ?? []),
    recommended: plan.recommended ?? configured?.recommended ?? false,
  };
}
