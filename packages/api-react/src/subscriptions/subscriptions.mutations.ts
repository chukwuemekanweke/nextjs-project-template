import type {
  BillingAccountOwnerType,
  CancelSubscriptionAtPeriodEndMutationRequest,
  PurchaseSubscriptionMutationRequest,
  SubscriptionsClient,
} from "@template/api-client/subscriptions";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "./subscriptions.keys";

export type PurchaseSubscriptionVariables = Readonly<{
  idempotencyKey: string;
  request: PurchaseSubscriptionMutationRequest;
}>;

/** Refreshes the owner's entitlement views after a purchase reaches an outcome. */
export function invalidateSubscriptionEntitlement(
  queryClient: QueryClient,
  ownerType: BillingAccountOwnerType,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: subscriptionKeys.current(ownerType),
    }),
    queryClient.invalidateQueries({
      queryKey: subscriptionKeys.billingHistories(ownerType),
    }),
  ]);
}

/**
 * The caller owns the idempotency key lifecycle: one key per logical checkout
 * attempt, reused for retries. Mutations never retry automatically.
 */
export const purchaseSubscriptionMutationOptions = (
  client: SubscriptionsClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...subscriptionKeys.all, "purchase"],
    mutationFn: ({ idempotencyKey, request }: PurchaseSubscriptionVariables) =>
      client.purchaseSubscription(request, idempotencyKey),
    onSuccess: (_data, { request }) =>
      queryClient
        ? Promise.all([
            queryClient.invalidateQueries({
              queryKey: subscriptionKeys.purchases(
                request.billingAccountOwnerType,
              ),
            }),
            invalidateSubscriptionEntitlement(
              queryClient,
              request.billingAccountOwnerType,
            ),
          ])
        : undefined,
  });

export const cancelSubscriptionAtPeriodEndMutationOptions = (
  client: SubscriptionsClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...subscriptionKeys.all, "cancel-at-period-end"],
    mutationFn: (request: CancelSubscriptionAtPeriodEndMutationRequest) =>
      client.cancelSubscriptionAtPeriodEnd(request),
    onSuccess: (_data, request) =>
      queryClient?.invalidateQueries({
        queryKey: subscriptionKeys.current(request.billingAccountOwnerType),
      }),
  });
