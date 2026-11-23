import type { SubscriptionPlanResponse } from "@template/api-client/subscriptions";
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
): string {
  const url = new URL(SUBSCRIPTION_CHECKOUT_PATH, `${userPortalUrl}/`);
  url.searchParams.set("planId", planId);
  return url.toString();
}

export function billingCadence(billingInterval: string): string {
  if (billingInterval === "Monthly") return "month";
  if (billingInterval === "Yearly") return "year";
  return billingInterval.toLowerCase();
}

export function toPricePlan(
  plan: SubscriptionPlanResponse,
  {
    marketing = {},
    userPortalUrl,
  }: Readonly<{ marketing?: PlanMarketingContent; userPortalUrl: string }>,
): PricePlan {
  const copy = marketing[plan.code];
  return {
    action: {
      href: subscriptionCheckoutHref(userPortalUrl, plan.id),
      label: "Subscribe",
    },
    cadence: billingCadence(plan.billingInterval),
    description:
      copy?.description ??
      `Billed ${plan.billingInterval.toLowerCase()} in ${plan.currencyCode}.`,
    features: copy?.highlights,
    id: plan.id,
    name: plan.name,
    price: formatMinorUnits(plan.price, plan.currencyCode),
  };
}
