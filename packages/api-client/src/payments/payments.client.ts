import type { ApiOperationOptions, ApiTransport } from "../client";
import type {
  GetWalletTopUpTransactionPathParams,
  GetWalletTopUpTransactionQueryResponse,
  GetWalletTransactionsQueryParams,
  GetWalletTransactionsQueryResponse,
  InitiatePaymentMutationRequest,
  InitiatePaymentMutationResponse,
  SetPaymentProviderActivationMutationRequest,
  SetPaymentProviderActivationPathParams,
} from "./contracts";
import {
  getWalletTopUpTransaction,
  getWalletTransactions,
  initiatePayment,
  setPaymentProviderActivation,
} from "./operations";

export interface PaymentsClient {
  getWalletTransactions(
    query?: GetWalletTransactionsQueryParams,
    options?: ApiOperationOptions,
  ): Promise<GetWalletTransactionsQueryResponse>;
  getWalletTopUpTransaction(
    path: GetWalletTopUpTransactionPathParams,
    options?: ApiOperationOptions,
  ): Promise<GetWalletTopUpTransactionQueryResponse>;
  initiatePayment(
    request: InitiatePaymentMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<InitiatePaymentMutationResponse>;
  setPaymentProviderActivation(
    path: SetPaymentProviderActivationPathParams,
    request: SetPaymentProviderActivationMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<void>;
}

export function createPaymentsClient(transport: ApiTransport): PaymentsClient {
  return {
    getWalletTransactions: (query, options) =>
      getWalletTransactions(transport, query, options),
    getWalletTopUpTransaction: (path, options) =>
      getWalletTopUpTransaction(transport, path, options),
    initiatePayment: (request, options) =>
      initiatePayment(transport, request, options),
    setPaymentProviderActivation: (path, request, options) =>
      setPaymentProviderActivation(transport, path, request, options),
  };
}
