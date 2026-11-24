import type {
  SubscriptionPlanPriceResponse,
  SubscriptionPlanResponse,
} from "./contracts";

type PlanPricing = Pick<
  SubscriptionPlanResponse,
  "billingInterval" | "price" | "prices"
>;

/**
 * The plan's offered intervals and prices, exactly as returned. Falls back to
 * the legacy single `price`/`billingInterval` fields while backends migrate.
 */
export function subscriptionPlanPrices(
  plan: PlanPricing,
): ReadonlyArray<SubscriptionPlanPriceResponse> {
  if (plan.prices && plan.prices.length > 0) return plan.prices;
  if (plan.billingInterval && plan.price !== undefined) {
    return [{ billingInterval: plan.billingInterval, price: plan.price }];
  }
  return [];
}

export function findSubscriptionPlanPrice(
  plan: PlanPricing,
  billingInterval: string | null | undefined,
): SubscriptionPlanPriceResponse | undefined {
  if (!billingInterval) return undefined;
  return subscriptionPlanPrices(plan).find(
    (price) => price.billingInterval === billingInterval,
  );
}

/**
 * The interval to show or preselect: the preferred one when offered, else
 * `Monthly` when offered, else the first offered interval.
 */
export function defaultSubscriptionPlanPrice(
  plan: PlanPricing,
  preferred?: string | null,
): SubscriptionPlanPriceResponse | undefined {
  return (
    findSubscriptionPlanPrice(plan, preferred) ??
    findSubscriptionPlanPrice(plan, "Monthly") ??
    subscriptionPlanPrices(plan)[0]
  );
}
