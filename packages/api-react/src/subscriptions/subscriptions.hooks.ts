"use client";

import type { BillingAccountOwnerType } from "@template/api-client/subscriptions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useApiClient } from "../query-client/api-provider";
import type { BillingHistoryPageKey } from "./subscriptions.keys";
import {
  cancelSubscriptionAtPeriodEndMutationOptions,
  invalidateSubscriptionEntitlement,
  purchaseSubscriptionMutationOptions,
} from "./subscriptions.mutations";
import {
  billingHistoryQueryOptions,
  currentSubscriptionQueryOptions,
  defaultPurchaseStatusPollingPolicy,
  eligiblePaymentProvidersQueryOptions,
  isPurchaseStatusPollingExhausted,
  subscriptionPlansQueryOptions,
  subscriptionPurchaseStatusQueryOptions,
  type PurchaseStatusPollingPolicy,
} from "./subscriptions.queries";

export const useSubscriptionPlans = () =>
  useQuery(subscriptionPlansQueryOptions(useApiClient().subscriptions));

export const useEligiblePaymentProviders = (
  planId: string,
  ownerType: BillingAccountOwnerType,
) =>
  useQuery(
    eligiblePaymentProvidersQueryOptions(
      useApiClient().subscriptions,
      planId,
      ownerType,
    ),
  );

/**
 * Polls while the backend reports `shouldContinuePolling`, up to the policy's
 * bound. `pollingExhausted` signals a still-pending purchase that now needs a
 * manual `refetch()`. A final outcome refreshes the owner's entitlement views.
 */
export function useSubscriptionPurchaseStatus(
  purchaseId: string,
  ownerType: BillingAccountOwnerType,
  policy: PurchaseStatusPollingPolicy = defaultPurchaseStatusPollingPolicy,
) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const options = subscriptionPurchaseStatusQueryOptions(
    api.subscriptions,
    purchaseId,
    ownerType,
    policy,
  );
  const query = useQuery(options);
  const settledStatus = query.data?.isTerminal ? query.data.status : undefined;

  useEffect(() => {
    if (settledStatus) {
      void invalidateSubscriptionEntitlement(queryClient, ownerType);
    }
  }, [ownerType, purchaseId, queryClient, settledStatus]);

  return {
    ...query,
    pollingExhausted: isPurchaseStatusPollingExhausted(
      queryClient.getQueryState(options.queryKey),
      policy,
    ),
  };
}

export const useCurrentSubscription = (ownerType: BillingAccountOwnerType) =>
  useQuery(
    currentSubscriptionQueryOptions(useApiClient().subscriptions, ownerType),
  );

export const useBillingHistory = (
  ownerType: BillingAccountOwnerType,
  page?: Partial<BillingHistoryPageKey>,
) =>
  useQuery(
    billingHistoryQueryOptions(useApiClient().subscriptions, ownerType, page),
  );

export function usePurchaseSubscription() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    purchaseSubscriptionMutationOptions(api.subscriptions, queryClient),
  );
}

export function useCancelSubscriptionAtPeriodEnd() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    cancelSubscriptionAtPeriodEndMutationOptions(
      api.subscriptions,
      queryClient,
    ),
  );
}
