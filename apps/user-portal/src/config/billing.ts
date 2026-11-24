import type { BillingAccountOwnerType } from "@template/api-client/subscriptions";

/**
 * The billing account this portal manages for the signed-in user.
 *
 * The backend derives the concrete BillingAccount from the authenticated actor
 * and this owner type; the portal never sends account ids. User Portal billing
 * is personal (`Stakeholder`). A product that bills the tenant organization
 * from this portal changes this resolution in one place; the backend remains
 * responsible for authorizing whoever may act for a `Tenant` account.
 */
export function resolveBillingOwnerType(): BillingAccountOwnerType {
  return "Stakeholder";
}

export const billingRoutes = {
  overview: "/billing",
  /** Full billing history; linked when the pricing grid replaces it on /billing. */
  history: "/billing/history",
  dashboard: "/dashboard",
  checkout: "/billing/checkout",
  /**
   * Provider return destinations. The backend sends absolute versions of the
   * success/cancelled routes to Bachs (`Payments:Bachs:SuccessUrl` and
   * `Payments:Bachs:CancelUrl`); each route verifies the purchase with the
   * backend before showing an outcome. `checkoutReturn` is the hint-free
   * equivalent for providers with a single return URL.
   */
  checkoutReturn: "/billing/checkout/return",
  checkoutSuccess: "/billing/checkout/success",
  checkoutCancelled: "/billing/checkout/cancelled",
  purchase: (purchaseId: string) =>
    `/billing/purchases/${encodeURIComponent(purchaseId)}`,
  checkoutForPlan: (planId: string, billingInterval?: string) =>
    `/billing/checkout?${new URLSearchParams(
      billingInterval ? { billingInterval, planId } : { planId },
    ).toString()}`,
} as const;

/**
 * Optional presentation for plan cards. The API's plan fields
 * (`description`, `features`, `badge`, `recommended`) take precedence; these
 * entries, keyed by backend plan `code`, fill gaps. They never supply prices,
 * currencies, intervals, or entitlements.
 */
export type PlanPresentation = Readonly<{
  /** Tier label shown as a neutral pill, for example "Starter". */
  badge?: string;
  description?: string;
  features?: ReadonlyArray<string>;
  /** Shows the "Most popular" highlight. */
  recommended?: boolean;
}>;

export const planPresentation: Readonly<Record<string, PlanPresentation>> = {};

/**
 * PLACEHOLDER content shown until `GET /api/v1/subscription-plans` returns
 * `description` and `features`. Remove once the backend provides them.
 */
export const placeholderPlanPresentation: PlanPresentation = {
  description: "Everything you need to get started.",
  features: ["Core features", "Up to 3 team members", "Email support"],
};
