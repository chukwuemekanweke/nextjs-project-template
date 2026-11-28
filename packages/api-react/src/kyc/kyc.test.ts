import { ApiError } from "@template/api-client";
import type {
  GetCurrentKycVerificationQueryResponse,
  KycClient,
} from "@template/api-client/kyc";
import { QueryClient, type MutationOptions } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { createApiQueryClient } from "../query-client/create-query-client";
import { kycKeys } from "./kyc.keys";
import { startKycVerificationMutationOptions } from "./kyc.mutations";
import {
  currentKycVerificationQueryOptions,
  isKycVerificationPollingExhausted,
  nextKycVerificationPoll,
} from "./kyc.queries";

const policy = { intervalMs: 1_000, maxPolls: 3 };

function verification(
  overrides: Partial<GetCurrentKycVerificationQueryResponse> = {},
): GetCurrentKycVerificationQueryResponse {
  return {
    completedAtUtc: null,
    isVerified: false,
    provider: "kycaid",
    startedAtUtc: "2026-11-28T12:00:00Z",
    status: "Pending",
    submittedAtUtc: null,
    verificationId: "verification-1",
    verificationUrl: "https://forms.kycaid.com/form/1",
    ...overrides,
  };
}

function createClient(overrides: Partial<KycClient> = {}): KycClient {
  return {
    getCurrentKycVerification: vi.fn().mockResolvedValue(verification()),
    startKycVerification: vi.fn().mockResolvedValue({
      provider: "kycaid",
      status: "Pending",
      verificationId: "verification-1",
      verificationUrl: "https://forms.kycaid.com/form/1",
    }),
    ...overrides,
  };
}

function execute<TData>(
  queryClient: QueryClient,
  options: MutationOptions<TData, Error, void, unknown>,
) {
  return queryClient
    .getMutationCache()
    .build(queryClient, options)
    .execute(undefined);
}

describe("KYC query", () => {
  it("uses one stable current-verification key and forwards cancellation", async () => {
    const client = createClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await queryClient.fetchQuery(currentKycVerificationQueryOptions(client));

    expect(kycKeys.current()).toEqual(["kyc", "current"]);
    expect(client.getCurrentKycVerification).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it.each(["Pending", "InProgress"])(
    "polls the transient %s status",
    (status) => {
      expect(
        nextKycVerificationPoll(
          {
            data: verification({ status }),
            dataUpdateCount: 1,
            status: "success",
          },
          policy,
        ),
      ).toBe(1_000);
    },
  );

  it.each([
    "NotStarted",
    "Verified",
    "Rejected",
    "Failed",
    "Expired",
    "Future",
  ])("does not poll the %s status", (status) => {
    expect(
      nextKycVerificationPoll(
        {
          data: verification({ status }),
          dataUpdateCount: 1,
          status: "success",
        },
        policy,
      ),
    ).toBe(false);
  });

  it("stops after an error or the polling budget and reports exhaustion", () => {
    const state = {
      data: verification({ status: "Pending" }),
      dataUpdateCount: 3,
      status: "success" as const,
    };
    expect(nextKycVerificationPoll(state, policy)).toBe(false);
    expect(isKycVerificationPollingExhausted(state, policy)).toBe(true);
    expect(nextKycVerificationPoll({ ...state, status: "error" }, policy)).toBe(
      false,
    );
    expect(
      isKycVerificationPollingExhausted(
        { ...state, data: verification({ status: "Verified" }) },
        policy,
      ),
    ).toBe(false);
  });
});

describe("KYC start mutation", () => {
  it("starts with no request fields and refreshes authoritative state", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await execute(
      queryClient,
      startKycVerificationMutationOptions(client, queryClient),
    );

    expect(client.startKycVerification).toHaveBeenCalledWith();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: kycKeys.current() });
  });

  it("also refetches after an ambiguous failure and never retries mutations", async () => {
    const failure = new ApiError({
      kind: "network",
      safeMessage: "Network unavailable",
    });
    const client = createClient({
      startKycVerification: vi.fn().mockRejectedValue(failure),
    });
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await expect(
      execute(
        queryClient,
        startKycVerificationMutationOptions(client, queryClient),
      ),
    ).rejects.toBe(failure);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: kycKeys.current() });
    expect(startKycVerificationMutationOptions(client).retry).toBeUndefined();
    expect(createApiQueryClient().getDefaultOptions().mutations?.retry).toBe(
      false,
    );
  });
});
