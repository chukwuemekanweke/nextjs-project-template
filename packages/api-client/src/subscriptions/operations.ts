import type {
  CancelSubscriptionAtPeriodEndMutationRequest,
  CancelSubscriptionAtPeriodEndMutationResponse,
  GetBillingHistoryQueryParams,
  GetBillingHistoryQueryResponse,
  GetCurrentSubscriptionQueryParams,
  GetCurrentSubscriptionQueryResponse,
  GetSubscriptionPurchaseStatusPathParams,
  GetSubscriptionPurchaseStatusQueryParams,
  GetSubscriptionPurchaseStatusQueryResponse,
  ListEligiblePaymentProvidersPathParams,
  ListEligiblePaymentProvidersQueryParams,
  ListEligiblePaymentProvidersQueryResponse,
  ListSubscriptionPlansQueryResponse,
  PurchaseSubscriptionMutationRequest,
  PurchaseSubscriptionMutationResponse,
} from "./contracts";
import { IDEMPOTENCY_KEY_HEADER, subscriptionsOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

export function isIdempotencyKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    UUID_PATTERN.test(value) &&
    value !== EMPTY_UUID
  );
}

/** Public: active purchasable plans. No bearer token is required. */
export const listSubscriptionPlans = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<ListSubscriptionPlansQueryResponse>({
    ...subscriptionsOperations.listSubscriptionPlans,
    ...options,
  });

export const listEligiblePaymentProviders = (
  client: ApiTransport,
  pathParams: ListEligiblePaymentProvidersPathParams,
  query: ListEligiblePaymentProvidersQueryParams,
  options?: ApiOperationOptions,
) =>
  client.request<ListEligiblePaymentProvidersQueryResponse>({
    ...subscriptionsOperations.listEligiblePaymentProviders,
    ...options,
    pathParams,
    query,
  });

/**
 * Initiates a purchase. `idempotencyKey` must be a stable UUID for one logical
 * checkout attempt: reuse it for retries of the same request and never for a
 * different plan, provider, owner, or auto-renew selection.
 */
export const purchaseSubscription = (
  client: ApiTransport,
  request: PurchaseSubscriptionMutationRequest,
  idempotencyKey: string,
  options?: ApiOperationOptions,
) => {
  if (!isIdempotencyKey(idempotencyKey)) {
    throw new TypeError("A non-empty UUID idempotency key is required.");
  }
  const headers = new Headers(options?.headers);
  headers.set(IDEMPOTENCY_KEY_HEADER, idempotencyKey);
  return client.request<PurchaseSubscriptionMutationResponse>({
    ...subscriptionsOperations.purchaseSubscription,
    ...options,
    body: request,
    headers,
  });
};

export const getSubscriptionPurchaseStatus = (
  client: ApiTransport,
  pathParams: GetSubscriptionPurchaseStatusPathParams,
  query: GetSubscriptionPurchaseStatusQueryParams,
  options?: ApiOperationOptions,
) =>
  client.request<GetSubscriptionPurchaseStatusQueryResponse>({
    ...subscriptionsOperations.getSubscriptionPurchaseStatus,
    ...options,
    pathParams,
    query,
  });

/** Returns `404` when the owner has no current pending/active subscription. */
export const getCurrentSubscription = (
  client: ApiTransport,
  query: GetCurrentSubscriptionQueryParams,
  options?: ApiOperationOptions,
) =>
  client.request<GetCurrentSubscriptionQueryResponse>({
    ...subscriptionsOperations.getCurrentSubscription,
    ...options,
    query,
  });

export const getBillingHistory = (
  client: ApiTransport,
  query: GetBillingHistoryQueryParams,
  options?: ApiOperationOptions,
) =>
  client.request<GetBillingHistoryQueryResponse>({
    ...subscriptionsOperations.getBillingHistory,
    ...options,
    query,
  });

/** Schedules cancellation at period end. Repeated requests are safe. */
export const cancelSubscriptionAtPeriodEnd = (
  client: ApiTransport,
  request: CancelSubscriptionAtPeriodEndMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<CancelSubscriptionAtPeriodEndMutationResponse>({
    ...subscriptionsOperations.cancelSubscriptionAtPeriodEnd,
    ...options,
    body: request,
  });
