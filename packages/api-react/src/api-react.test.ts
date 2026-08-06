import type { ApiClient } from "@template/api-client";
import { ApiError } from "@template/api-client";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  initiatePaymentMutationOptions,
  getQueryOptions,
  paymentKeys,
  queryClientDefaults,
  shouldRetryQuery,
  walletTopUpQueryOptions,
  walletTransactionsQueryOptions,
} from ".";

const createClient = () =>
  ({
    payments: {
      getWalletTransactions: vi
        .fn()
        .mockResolvedValue({ nextCursor: null, transactions: [] }),
      getWalletTopUpTransaction: vi
        .fn()
        .mockResolvedValue({ walletTransactionId: "wallet-1" }),
      initiatePayment: vi
        .fn()
        .mockResolvedValue({ merchantReference: "merchant-1" }),
    },
  }) as unknown as ApiClient;

describe("API React integration", () => {
  it("creates stable hierarchical keys", () => {
    expect(paymentKeys.walletTransactionList({ Limit: 25 })).toEqual([
      "payments",
      "wallet-transactions",
      "list",
      { Limit: 25 },
    ]);
    expect(paymentKeys.walletTopUpDetail("wallet-1")).toEqual([
      "payments",
      "wallet-transactions",
      "detail",
      "top-up",
      "wallet-1",
    ]);
  });

  it("calls the domain client and propagates TanStack Query cancellation", async () => {
    const client = createClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await queryClient.fetchQuery(
      walletTransactionsQueryOptions(client.payments, { Limit: 10 }),
    );
    expect(client.payments.getWalletTransactions).toHaveBeenCalledWith(
      { Limit: 10 },
      { signal: expect.any(AbortSignal) },
    );
  });

  it("supports disabled detail queries", () => {
    expect(walletTopUpQueryOptions(createClient().payments, "").enabled).toBe(
      false,
    );
  });

  it("retains typed API errors from failed queries", async () => {
    const client = createClient();
    const error = new ApiError({
      kind: "not-found",
      safeMessage: "Not found",
      status: 404,
    });
    vi.mocked(client.payments.getWalletTransactions).mockRejectedValue(error);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await expect(
      queryClient.fetchQuery(walletTransactionsQueryOptions(client.payments)),
    ).rejects.toBe(error);
  });

  it("invalidates wallet data after a successful payment mutation", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const options = initiatePaymentMutationOptions(
      client.payments,
      queryClient,
    );
    const mutation = queryClient.getMutationCache().build(queryClient, options);
    await mutation.execute({
      amount: 10,
      currencyId: "currency-1",
      paymentIntent: "top-up",
      paymentProviderId: "provider-1",
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: paymentKeys.walletTransactions(),
    });
  });

  it("centralizes cache defaults and avoids retrying client errors", () => {
    expect(queryClientDefaults.staleTime).toBe(30_000);
    expect(
      shouldRetryQuery(
        0,
        new ApiError({
          kind: "validation",
          safeMessage: "Invalid",
          status: 422,
        }),
      ),
    ).toBe(false);
    expect(
      shouldRetryQuery(
        0,
        new ApiError({
          kind: "server",
          safeMessage: "Unavailable",
          status: 503,
        }),
      ),
    ).toBe(true);
    expect(shouldRetryQuery(2, new Error("network"))).toBe(false);
  });

  it("rejects write operations from retryable query options", () => {
    expect(() =>
      getQueryOptions(
        {
          method: "POST",
          path: "/api/v1/payments/initiate",
        } as unknown as { method: "GET"; path: string },
        {
          queryKey: ["unsafe-write"],
          queryFn: () => Promise.resolve(null),
        },
      ),
    ).toThrow(
      "TanStack Query retries are restricted to GET operations; received POST /api/v1/payments/initiate.",
    );
  });
});
