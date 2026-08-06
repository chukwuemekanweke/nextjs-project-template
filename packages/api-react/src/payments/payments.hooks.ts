"use client";

import type { GetWalletTransactionsQueryParams } from "@template/api-client/payments";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import { initiatePaymentMutationOptions } from "./payments.mutations";
import {
  walletTopUpQueryOptions,
  walletTransactionsQueryOptions,
} from "./payments.queries";

export const useWalletTransactions = (
  filters: GetWalletTransactionsQueryParams = {},
) => useQuery(walletTransactionsQueryOptions(useApiClient().payments, filters));
export const useWalletTopUp = (walletTransactionId: string) =>
  useQuery(
    walletTopUpQueryOptions(useApiClient().payments, walletTransactionId),
  );
export function useInitiatePayment() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(initiatePaymentMutationOptions(api.payments, queryClient));
}
