import {
  defaultSubscriptionPlanPrice,
  type SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import type { PricePlan } from "@template/public-ui";
import { formatMinorUnits } from "@template/ui-core";

/** User Portal route that owns authenticated subscription checkout. */
export const SUBSCRIPTION_CHECKOUT_PATH = "/billing/checkout";

/**
 * Optional, non-authoritative marketing copy keyed by backend plan `code`.
 * It never supplies prices, currencies, intervals, or entitlements.
 */
export type PlanMarketingContent = Readonly<
  Record<string, Readonly<{ description?: string; highlights?: string[] }>>
>;

/**
 * Builds the User Portal checkout destination. Unauthenticated visitors are
 * sent by the User Portal proxy to sign-in with this path as `returnTo`.
 */
export function subscriptionCheckoutHref(
  userPortalUrl: string,
  planId: string,
  billingInterval?: string,
): string {
  const url = new URL(SUBSCRIPTION_CHECKOUT_PATH, `${userPortalUrl}/`);
  url.searchParams.set("planId", planId);
  if (billingInterval) url.searchParams.set("billingInterval", billingInterval);
  return url.toString();
}

export function billingCadence(billingInterval: string): string {
  if (billingInterval === "Monthly") return "month";
  if (billingInterval === "Yearly") return "year";
  return billingInterval.toLowerCase();
}

/**
 * Maps a plan to the shared pricing card at its default interval (Monthly
 * when offered). Returns `undefined` for a plan that offers no price. API
 * presentation fields win over local marketing copy.
 */
export function toPricePlan(
  plan: SubscriptionPlanResponse,
  {
    marketing = {},
    userPortalUrl,
  }: Readonly<{ marketing?: PlanMarketingContent; userPortalUrl: string }>,
): PricePlan | undefined {
  const offered = defaultSubscriptionPlanPrice(plan);
  if (!offered) return undefined;
  const copy = marketing[plan.code];
  const features = plan.features?.length ? plan.features : copy?.highlights;
  return {
    action: {
      href: subscriptionCheckoutHref(
        userPortalUrl,
        plan.id,
        offered.billingInterval,
      ),
      label: "Subscribe",
    },
    cadence: billingCadence(offered.billingInterval),
    description:
      plan.description?.trim() ||
      copy?.description ||
      `Billed ${offered.billingInterval.toLowerCase()} in ${plan.currencyCode}.`,
    features,
    id: plan.id,
    name: plan.name,
    price: formatMinorUnits(offered.price, plan.currencyCode),
  };
}
