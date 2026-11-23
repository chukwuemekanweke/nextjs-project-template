import { ApiError } from "@template/api-client";
import type {
  GetSubscriptionPurchaseStatusQueryResponse,
  SubscriptionsClient,
} from "@template/api-client/subscriptions";
import { type MutationOptions, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { createApiQueryClient } from "../query-client/create-query-client";
import { subscriptionKeys } from "./subscriptions.keys";
import {
  cancelSubscriptionAtPeriodEndMutationOptions,
  invalidateSubscriptionEntitlement,
  purchaseSubscriptionMutationOptions,
} from "./subscriptions.mutations";
import {
  billingHistoryQueryOptions,
  currentSubscriptionQueryOptions,
  eligiblePaymentProvidersQueryOptions,
  isPurchaseStatusPollingExhausted,
  nextPurchaseStatusPoll,
  subscriptionPlansQueryOptions,
  subscriptionPurchaseStatusQueryOptions,
} from "./subscriptions.queries";

const KEY = "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10";
const policy = { intervalMs: 1_000, maxPolls: 3 };

function status(
  overrides: Partial<GetSubscriptionPurchaseStatusQueryResponse> = {},
): GetSubscriptionPurchaseStatusQueryResponse {
  return {
    amount: 750000,
    currencyCode: "NGN",
    currentPeriodEndUtc: null,
    fulfilledAtUtc: null,
    fulfillmentBlockedAtUtc: null,
    fulfillmentBlockedReason: null,
    fulfillmentStatus: "Pending",
    isTerminal: false,
    merchantReference: "pay_1",
    paymentCompletedAtUtc: null,
    paymentExpiresAtUtc: null,
    paymentMethodType: "PaymentLink",
    paymentProviderName: "Bachs",
    paymentStatus: "Initiated",
    purchaseId: "purchase-1",
    shouldContinuePolling: true,
    status: "PaymentPending",
    subscriptionId: "subscription-1",
    subscriptionStatus: "Pending",
    ...overrides,
  };
}

function createClient(overrides: Partial<SubscriptionsClient> = {}) {
  return {
    cancelSubscriptionAtPeriodEnd: vi.fn().mockResolvedValue({
      changed: true,
      entitledUntilUtc: "2026-12-23T12:05:00Z",
      found: true,
    }),
    getBillingHistory: vi
      .fn()
      .mockResolvedValue({ items: [], page: 1, pageSize: 20, totalCount: 0 }),
    getCurrentSubscription: vi.fn(),
    getSubscriptionPurchaseStatus: vi.fn().mockResolvedValue(status()),
    listEligiblePaymentProviders: vi.fn().mockResolvedValue([]),
    listSubscriptionPlans: vi.fn().mockResolvedValue([]),
    purchaseSubscription: vi.fn().mockResolvedValue({ purchaseId: "p-1" }),
    ...overrides,
  } as unknown as SubscriptionsClient;
}

function execute<TData, TVariables>(
  queryClient: QueryClient,
  options: MutationOptions<TData, Error, TVariables, unknown>,
  variables: TVariables,
) {
  return queryClient
    .getMutationCache()
    .build(queryClient, options)
    .execute(variables);
}

const quietClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("subscription query keys", () => {
  it("isolates every customer entry by billing owner type", () => {
    expect(subscriptionKeys.current("Stakeholder")).not.toEqual(
      subscriptionKeys.current("Tenant"),
    );
    expect(
      subscriptionKeys.eligibleProviders("Stakeholder", "plan-1"),
    ).not.toEqual(subscriptionKeys.eligibleProviders("Tenant", "plan-1"));
    expect(subscriptionKeys.purchaseStatus("Tenant", "p-1")).toEqual([
      "subscriptions",
      "owner",
      "Tenant",
      "purchases",
      "p-1",
    ]);
    expect(
      subscriptionKeys.billingHistory("Stakeholder", { page: 2, pageSize: 20 }),
    ).toEqual([
      "subscriptions",
      "owner",
      "Stakeholder",
      "billing-history",
      { page: 2, pageSize: 20 },
    ]);
    expect(subscriptionKeys.plans()).toEqual(["subscriptions", "plans"]);
  });
});

describe("subscription queries", () => {
  it("forwards cancellation signals and owner scope", async () => {
    const client = createClient();
    const queryClient = quietClient();

    await queryClient.fetchQuery(subscriptionPlansQueryOptions(client));
    await queryClient.fetchQuery(
      eligiblePaymentProvidersQueryOptions(client, "plan-1", "Tenant"),
    );
    await queryClient.fetchQuery(
      billingHistoryQueryOptions(client, "Stakeholder", { page: 3 }),
    );

    expect(client.listSubscriptionPlans).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
    expect(client.listEligiblePaymentProviders).toHaveBeenCalledWith(
      { planId: "plan-1" },
      { BillingAccountOwnerType: "Tenant" },
      { signal: expect.any(AbortSignal) },
    );
    expect(client.getBillingHistory).toHaveBeenCalledWith(
      { BillingAccountOwnerType: "Stakeholder", Page: 3, PageSize: 20 },
      { signal: expect.any(AbortSignal) },
    );
  });

  it("disables provider and status queries without identifiers", () => {
    const client = createClient();
    expect(
      eligiblePaymentProvidersQueryOptions(client, "", "Stakeholder").enabled,
    ).toBe(false);
    expect(
      subscriptionPurchaseStatusQueryOptions(client, "", "Stakeholder").enabled,
    ).toBe(false);
  });

  it("treats a missing current subscription as an empty state", async () => {
    const client = createClient({
      getCurrentSubscription: vi.fn().mockRejectedValue(
        new ApiError({
          kind: "not-found",
          safeMessage: "Missing",
          status: 404,
        }),
      ),
    });

    await expect(
      quietClient().fetchQuery(
        currentSubscriptionQueryOptions(client, "Stakeholder"),
      ),
    ).resolves.toBeNull();
  });

  it("keeps other current-subscription failures as errors", async () => {
    const failure = new ApiError({
      kind: "server",
      safeMessage: "Unavailable",
      status: 503,
    });
    const client = createClient({
      getCurrentSubscription: vi.fn().mockRejectedValue(failure),
    });

    await expect(
      quietClient().fetchQuery(
        currentSubscriptionQueryOptions(client, "Stakeholder"),
      ),
    ).rejects.toBe(failure);
  });

  it("surfaces purchase-status errors", async () => {
    const failure = new ApiError({
      kind: "not-found",
      safeMessage: "Missing",
      status: 404,
    });
    const client = createClient({
      getSubscriptionPurchaseStatus: vi.fn().mockRejectedValue(failure),
    });

    await expect(
      quietClient().fetchQuery(
        subscriptionPurchaseStatusQueryOptions(client, "p-1", "Stakeholder"),
      ),
    ).rejects.toBe(failure);
  });
});

describe("purchase status polling", () => {
  it("polls only while the backend says to continue", () => {
    expect(
      nextPurchaseStatusPoll(
        { data: status(), dataUpdateCount: 1, status: "success" },
        policy,
      ),
    ).toBe(1_000);
    expect(
      nextPurchaseStatusPoll(
        {
          data: status({
            isTerminal: true,
            shouldContinuePolling: false,
            status: "SubscriptionActive",
          }),
          dataUpdateCount: 1,
          status: "success",
        },
        policy,
      ),
    ).toBe(false);
  });

  it("stops at the polling bound and reports exhaustion, not failure", () => {
    const state = {
      data: status({ status: "PaymentSucceededFulfillmentPending" }),
      dataUpdateCount: 3,
      status: "success" as const,
    };
    expect(nextPurchaseStatusPoll(state, policy)).toBe(false);
    expect(isPurchaseStatusPollingExhausted(state, policy)).toBe(true);
    expect(
      isPurchaseStatusPollingExhausted(
        {
          ...state,
          data: status({ isTerminal: true, shouldContinuePolling: false }),
        },
        policy,
      ),
    ).toBe(false);
  });

  it("stops polling after a status read fails", () => {
    expect(
      nextPurchaseStatusPoll(
        { data: status(), dataUpdateCount: 1, status: "error" },
        policy,
      ),
    ).toBe(false);
  });

  it("wires the polling decision into the query options", () => {
    const options = subscriptionPurchaseStatusQueryOptions(
      createClient(),
      "p-1",
      "Stakeholder",
      policy,
    );
    const refetchInterval = options.refetchInterval as (query: {
      state: unknown;
    }) => number | false;
    expect(
      refetchInterval({
        state: { data: status(), dataUpdateCount: 2, status: "success" },
      }),
    ).toBe(1_000);
    expect(options.staleTime).toBe(0);
  });
});

describe("subscription mutations", () => {
  it("sends the caller's idempotency key and invalidates owner-scoped state", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const request = {
      autoRenew: true,
      billingAccountOwnerType: "Stakeholder" as const,
      paymentProviderId: "provider-1",
      planId: "plan-1",
    };

    await execute(
      queryClient,
      purchaseSubscriptionMutationOptions(client, queryClient),
      { idempotencyKey: KEY, request },
    );

    expect(client.purchaseSubscription).toHaveBeenCalledWith(request, KEY);
    const invalidated = invalidate.mock.calls.map(
      ([filters]) => filters?.queryKey,
    );
    expect(invalidated).toEqual(
      expect.arrayContaining([
        subscriptionKeys.purchases("Stakeholder"),
        subscriptionKeys.current("Stakeholder"),
        subscriptionKeys.billingHistories("Stakeholder"),
      ]),
    );
    expect(invalidated).not.toContainEqual(["payments"]);
    expect(invalidated).not.toContainEqual(subscriptionKeys.all);
  });

  it("does not invalidate after a failed purchase", async () => {
    const client = createClient({
      purchaseSubscription: vi.fn().mockRejectedValue(
        new ApiError({
          kind: "conflict",
          safeMessage: "Conflict",
          status: 409,
        }),
      ),
    });
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await expect(
      execute(
        queryClient,
        purchaseSubscriptionMutationOptions(client, queryClient),
        {
          idempotencyKey: KEY,
          request: {
            autoRenew: true,
            billingAccountOwnerType: "Stakeholder",
            paymentProviderId: "provider-1",
            planId: "plan-1",
          },
        },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("refreshes only the current subscription after cancellation", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await expect(
      execute(
        queryClient,
        cancelSubscriptionAtPeriodEndMutationOptions(client, queryClient),
        { billingAccountOwnerType: "Tenant" },
      ),
    ).resolves.toMatchObject({ entitledUntilUtc: "2026-12-23T12:05:00Z" });

    expect(client.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith({
      billingAccountOwnerType: "Tenant",
    });
    expect(invalidate).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: subscriptionKeys.current("Tenant"),
    });
  });

  it("refreshes entitlement views without touching other owners", async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateSubscriptionEntitlement(queryClient, "Stakeholder");

    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual(
      [
        subscriptionKeys.current("Stakeholder"),
        subscriptionKeys.billingHistories("Stakeholder"),
      ],
    );
  });

  it("does not retry purchases automatically", () => {
    const options = purchaseSubscriptionMutationOptions(createClient());
    expect(options.retry).toBeUndefined();
    expect(createApiQueryClient().getDefaultOptions().mutations?.retry).toBe(
      false,
    );
  });
});
