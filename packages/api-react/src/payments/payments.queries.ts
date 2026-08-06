import type {
  GetWalletTransactionsQueryParams,
  PaymentsClient,
} from "@template/api-client/payments";
import { queryOptions } from "@tanstack/react-query";
import { paymentKeys } from "./payments.keys";

export const walletTransactionsQueryOptions = (
  client: PaymentsClient,
  filters: GetWalletTransactionsQueryParams = {},
) =>
  queryOptions({
    queryKey: paymentKeys.walletTransactionList(filters),
    queryFn: ({ signal }) => client.getWalletTransactions(filters, { signal }),
  });
export const walletTopUpQueryOptions = (
  client: PaymentsClient,
  walletTransactionId: string,
) =>
  queryOptions({
    enabled: walletTransactionId.length > 0,
    queryKey: paymentKeys.walletTopUpDetail(walletTransactionId),
    queryFn: ({ signal }) =>
      client.getWalletTopUpTransaction({ walletTransactionId }, { signal }),
  });
