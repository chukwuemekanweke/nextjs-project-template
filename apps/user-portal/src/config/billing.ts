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
  checkoutForPlan: (planId: string) =>
    `/billing/checkout?${new URLSearchParams({ planId }).toString()}`,
} as const;
