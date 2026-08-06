/** Wire contracts owned by the payments domain. */
export type GetWalletTransactionsQueryParams = {
  Cursor?: string;
  Limit?: number | string;
};

export type WalletTransactionResponse = {
  amount: number | string;
  currencyCode: string;
  timestamp: string;
  transactionCategory: string;
  transactionTitle: string;
  transactionType: string;
};

export type GetWalletTransactionsQueryResponse = {
  nextCursor: string | null;
  transactions: Array<WalletTransactionResponse>;
};

export type GetWalletTopUpTransactionPathParams = {
  walletTransactionId: string;
};
export type GetWalletTopUpTransactionQueryResponse = {
  amount: number | string;
  currencyCode: string;
  description: string | null;
  merchantReference: string;
  paymentMethodType: string;
  paymentProviderName: string;
  timestamp: string;
  transactionTitle: string;
  walletTransactionId: string;
};

export type SetPaymentProviderActivationPathParams = { id: string };
export type SetPaymentProviderActivationMutationRequest = { isActive: boolean };
export type SetPaymentProviderActivationMutationResponse = void;

export type InitiatePaymentMutationRequest = {
  amount: number | string;
  currencyId: string;
  paymentIntent: string;
  paymentProviderId: string;
};

export type InitiatePaymentMutationResponse = {
  expiresAtUtc: string | null;
  merchantReference: string;
  paymentInstruction: Record<string, string>;
  paymentMethodType: string;
  paymentProviderId: string;
  paymentProviderName: string;
  paymentStatus: string;
};

export const paymentsOperations = {
  getWalletTopUpTransaction: {
    method: "GET",
    path: "/api/v1/payments/wallet-transactions/top-ups/{walletTransactionId}",
  },
  getWalletTransactions: {
    method: "GET",
    path: "/api/v1/payments/wallet-transactions",
  },
  initiatePayment: { method: "POST", path: "/api/v1/payments/initiate" },
  setPaymentProviderActivation: {
    method: "PUT",
    path: "/api/v1/payment-providers/{id}/activation",
  },
} as const;
