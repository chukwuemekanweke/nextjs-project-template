import type {
  GetWalletTopUpTransactionPathParams,
  GetWalletTopUpTransactionQueryResponse,
  GetWalletTransactionsQueryParams,
  GetWalletTransactionsQueryResponse,
  InitiatePaymentMutationRequest,
  InitiatePaymentMutationResponse,
  SetPaymentProviderActivationMutationRequest,
  SetPaymentProviderActivationMutationResponse,
  SetPaymentProviderActivationPathParams,
} from "./contracts";
import { paymentsOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

export const getWalletTransactions = (
  client: ApiTransport,
  query: GetWalletTransactionsQueryParams = {},
  options?: ApiOperationOptions,
) =>
  client.request<GetWalletTransactionsQueryResponse>({
    ...paymentsOperations.getWalletTransactions,
    ...options,
    query,
  });

export const getWalletTopUpTransaction = (
  client: ApiTransport,
  pathParams: GetWalletTopUpTransactionPathParams,
  options?: ApiOperationOptions,
) =>
  client.request<GetWalletTopUpTransactionQueryResponse>({
    ...paymentsOperations.getWalletTopUpTransaction,
    ...options,
    pathParams,
  });

export const setPaymentProviderActivation = (
  client: ApiTransport,
  pathParams: SetPaymentProviderActivationPathParams,
  request: SetPaymentProviderActivationMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SetPaymentProviderActivationMutationResponse>({
    ...paymentsOperations.setPaymentProviderActivation,
    ...options,
    body: request,
    pathParams,
  });

export const initiatePayment = (
  client: ApiTransport,
  request: InitiatePaymentMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<InitiatePaymentMutationResponse>({
    ...paymentsOperations.initiatePayment,
    ...options,
    body: request,
  });
