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
  checkout: "/billing/checkout",
  checkoutReturn: "/billing/checkout/return",
  purchase: (purchaseId: string) =>
    `/billing/purchases/${encodeURIComponent(purchaseId)}`,
  checkoutForPlan: (planId: string) =>
    `/billing/checkout?${new URLSearchParams({ planId }).toString()}`,
} as const;
