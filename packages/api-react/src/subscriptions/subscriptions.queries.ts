import { isApiError } from "@template/api-client";
import type {
  BillingAccountOwnerType,
  GetSubscriptionPurchaseStatusQueryResponse,
  SubscriptionsClient,
} from "@template/api-client/subscriptions";
import { subscriptionsOperations } from "@template/api-client/subscriptions";
import { keepPreviousData, type QueryState } from "@tanstack/react-query";
import { getQueryOptions } from "../query-client/get-query-options";
import {
  subscriptionKeys,
  type BillingHistoryPageKey,
} from "./subscriptions.keys";

export const DEFAULT_BILLING_HISTORY_PAGE_SIZE = 20;

export type PurchaseStatusPollingPolicy = Readonly<{
  /** Delay between successful status reads while the backend says to poll. */
  intervalMs: number;
  /** Successful reads after which automatic polling stops. */
  maxPolls: number;
}>;

/** About two minutes of automatic polling before falling back to manual refresh. */
export const defaultPurchaseStatusPollingPolicy: PurchaseStatusPollingPolicy =
  Object.freeze({ intervalMs: 3_000, maxPolls: 40 });

export const subscriptionPlansQueryOptions = (client: SubscriptionsClient) =>
  getQueryOptions(subscriptionsOperations.listSubscriptionPlans, {
    queryKey: subscriptionKeys.plans(),
    queryFn: ({ signal }) => client.listSubscriptionPlans({ signal }),
  });

export const eligiblePaymentProvidersQueryOptions = (
  client: SubscriptionsClient,
  planId: string,
  ownerType: BillingAccountOwnerType,
) =>
  getQueryOptions(subscriptionsOperations.listEligiblePaymentProviders, {
    enabled: planId.length > 0,
    queryKey: subscriptionKeys.eligibleProviders(ownerType, planId),
    queryFn: ({ signal }) =>
      client.listEligiblePaymentProviders(
        { planId },
        { BillingAccountOwnerType: ownerType },
        { signal },
      ),
  });

type PurchaseStatusState = Pick<
  QueryState<GetSubscriptionPurchaseStatusQueryResponse>,
  "data" | "dataUpdateCount" | "status"
>;

/** Next automatic poll delay, or `false` when polling must stop. */
export function nextPurchaseStatusPoll(
  state: PurchaseStatusState,
  policy: PurchaseStatusPollingPolicy = defaultPurchaseStatusPollingPolicy,
): number | false {
  if (state.status === "error" || !state.data?.shouldContinuePolling) {
    return false;
  }
  return state.dataUpdateCount < policy.maxPolls ? policy.intervalMs : false;
}

/**
 * True when the client-side bound stopped polling while the backend still
 * reports a non-final purchase. This is not evidence of payment failure.
 */
export function isPurchaseStatusPollingExhausted(
  state: PurchaseStatusState | undefined,
  policy: PurchaseStatusPollingPolicy = defaultPurchaseStatusPollingPolicy,
): boolean {
  return Boolean(
    state?.data?.shouldContinuePolling &&
    state.dataUpdateCount >= policy.maxPolls,
  );
}

export const subscriptionPurchaseStatusQueryOptions = (
  client: SubscriptionsClient,
  purchaseId: string,
  ownerType: BillingAccountOwnerType,
  policy: PurchaseStatusPollingPolicy = defaultPurchaseStatusPollingPolicy,
) =>
  getQueryOptions(subscriptionsOperations.getSubscriptionPurchaseStatus, {
    enabled: purchaseId.length > 0,
    queryKey: subscriptionKeys.purchaseStatus(ownerType, purchaseId),
    queryFn: ({ signal }) =>
      client.getSubscriptionPurchaseStatus(
        { purchaseId },
        { BillingAccountOwnerType: ownerType },
        { signal },
      ),
    refetchInterval: (query) => nextPurchaseStatusPoll(query.state, policy),
    staleTime: 0,
  });

/**
 * The backend answers `404` when the owner has no current subscription. That is
 * an expected empty state, so it resolves to `null` instead of an error.
 */
export const currentSubscriptionQueryOptions = (
  client: SubscriptionsClient,
  ownerType: BillingAccountOwnerType,
) =>
  getQueryOptions(subscriptionsOperations.getCurrentSubscription, {
    queryKey: subscriptionKeys.current(ownerType),
    queryFn: async ({ signal }) => {
      try {
        return await client.getCurrentSubscription(
          { BillingAccountOwnerType: ownerType },
          { signal },
        );
      } catch (error) {
        if (isApiError(error) && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

export const billingHistoryQueryOptions = (
  client: SubscriptionsClient,
  ownerType: BillingAccountOwnerType,
  {
    page = 1,
    pageSize = DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  }: Partial<BillingHistoryPageKey> = {},
) =>
  getQueryOptions(subscriptionsOperations.getBillingHistory, {
    placeholderData: keepPreviousData,
    queryKey: subscriptionKeys.billingHistory(ownerType, { page, pageSize }),
    queryFn: ({ signal }) =>
      client.getBillingHistory(
        { BillingAccountOwnerType: ownerType, Page: page, PageSize: pageSize },
        { signal },
      ),
  });
