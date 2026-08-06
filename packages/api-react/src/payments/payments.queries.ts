import type {
  GetWalletTransactionsQueryParams,
  PaymentsClient,
} from "@template/api-client/payments";
import { paymentsOperations } from "@template/api-client/payments";
import { getQueryOptions } from "../query-client/get-query-options";
import { paymentKeys } from "./payments.keys";

export const walletTransactionsQueryOptions = (
  client: PaymentsClient,
  filters: GetWalletTransactionsQueryParams = {},
) =>
  getQueryOptions(paymentsOperations.getWalletTransactions, {
    queryKey: paymentKeys.walletTransactionList(filters),
    queryFn: ({ signal }) => client.getWalletTransactions(filters, { signal }),
  });
export const walletTopUpQueryOptions = (
  client: PaymentsClient,
  walletTransactionId: string,
) =>
  getQueryOptions(paymentsOperations.getWalletTopUpTransaction, {
    enabled: walletTransactionId.length > 0,
    queryKey: paymentKeys.walletTopUpDetail(walletTransactionId),
    queryFn: ({ signal }) =>
      client.getWalletTopUpTransaction({ walletTransactionId }, { signal }),
  });
