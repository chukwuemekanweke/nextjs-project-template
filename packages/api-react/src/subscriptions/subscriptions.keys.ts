import type { BillingAccountOwnerType } from "@template/api-client/subscriptions";

export type BillingHistoryPageKey = Readonly<{
  page: number;
  pageSize: number;
}>;

/**
 * Customer data is always nested under the billing-owner scope so Tenant and
 * Stakeholder billing contexts can never share cache entries. Public plans are
 * the only unscoped entry.
 */
export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  owner: (ownerType: BillingAccountOwnerType) =>
    [...subscriptionKeys.all, "owner", ownerType] as const,
  eligibleProviders: (ownerType: BillingAccountOwnerType, planId: string) =>
    [
      ...subscriptionKeys.owner(ownerType),
      "plans",
      planId,
      "payment-providers",
    ] as const,
  purchases: (ownerType: BillingAccountOwnerType) =>
    [...subscriptionKeys.owner(ownerType), "purchases"] as const,
  purchaseStatus: (ownerType: BillingAccountOwnerType, purchaseId: string) =>
    [...subscriptionKeys.purchases(ownerType), purchaseId] as const,
  current: (ownerType: BillingAccountOwnerType) =>
    [...subscriptionKeys.owner(ownerType), "current"] as const,
  billingHistories: (ownerType: BillingAccountOwnerType) =>
    [...subscriptionKeys.owner(ownerType), "billing-history"] as const,
  billingHistory: (
    ownerType: BillingAccountOwnerType,
    { page, pageSize }: BillingHistoryPageKey,
  ) =>
    [
      ...subscriptionKeys.billingHistories(ownerType),
      { page, pageSize },
    ] as const,
};
