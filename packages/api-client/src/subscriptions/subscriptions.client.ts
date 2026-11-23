import type { ApiOperationOptions, ApiTransport } from "../client";
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
import {
  cancelSubscriptionAtPeriodEnd,
  getBillingHistory,
  getCurrentSubscription,
  getSubscriptionPurchaseStatus,
  listEligiblePaymentProviders,
  listSubscriptionPlans,
  purchaseSubscription,
} from "./operations";

export interface SubscriptionsClient {
  listSubscriptionPlans(
    options?: ApiOperationOptions,
  ): Promise<ListSubscriptionPlansQueryResponse>;
  listEligiblePaymentProviders(
    path: ListEligiblePaymentProvidersPathParams,
    query: ListEligiblePaymentProvidersQueryParams,
    options?: ApiOperationOptions,
  ): Promise<ListEligiblePaymentProvidersQueryResponse>;
  purchaseSubscription(
    request: PurchaseSubscriptionMutationRequest,
    idempotencyKey: string,
    options?: ApiOperationOptions,
  ): Promise<PurchaseSubscriptionMutationResponse>;
  getSubscriptionPurchaseStatus(
    path: GetSubscriptionPurchaseStatusPathParams,
    query: GetSubscriptionPurchaseStatusQueryParams,
    options?: ApiOperationOptions,
  ): Promise<GetSubscriptionPurchaseStatusQueryResponse>;
  getCurrentSubscription(
    query: GetCurrentSubscriptionQueryParams,
    options?: ApiOperationOptions,
  ): Promise<GetCurrentSubscriptionQueryResponse>;
  getBillingHistory(
    query: GetBillingHistoryQueryParams,
    options?: ApiOperationOptions,
  ): Promise<GetBillingHistoryQueryResponse>;
  cancelSubscriptionAtPeriodEnd(
    request: CancelSubscriptionAtPeriodEndMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<CancelSubscriptionAtPeriodEndMutationResponse>;
}

export function createSubscriptionsClient(
  transport: ApiTransport,
): SubscriptionsClient {
  return {
    listSubscriptionPlans: (options) =>
      listSubscriptionPlans(transport, options),
    listEligiblePaymentProviders: (path, query, options) =>
      listEligiblePaymentProviders(transport, path, query, options),
    purchaseSubscription: (request, idempotencyKey, options) =>
      purchaseSubscription(transport, request, idempotencyKey, options),
    getSubscriptionPurchaseStatus: (path, query, options) =>
      getSubscriptionPurchaseStatus(transport, path, query, options),
    getCurrentSubscription: (query, options) =>
      getCurrentSubscription(transport, query, options),
    getBillingHistory: (query, options) =>
      getBillingHistory(transport, query, options),
    cancelSubscriptionAtPeriodEnd: (request, options) =>
      cancelSubscriptionAtPeriodEnd(transport, request, options),
  };
}
