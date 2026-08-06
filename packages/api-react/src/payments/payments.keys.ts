import type { GetWalletTransactionsQueryParams } from "@template/api-client/payments";

export const paymentKeys = {
  all: ["payments"] as const,
  walletTransactions: () =>
    [...paymentKeys.all, "wallet-transactions"] as const,
  walletTransactionList: (filters: GetWalletTransactionsQueryParams = {}) =>
    [...paymentKeys.walletTransactions(), "list", filters] as const,
  walletTransactionDetails: () =>
    [...paymentKeys.walletTransactions(), "detail"] as const,
  walletTopUpDetail: (walletTransactionId: string) =>
    [
      ...paymentKeys.walletTransactionDetails(),
      "top-up",
      walletTransactionId,
    ] as const,
};
