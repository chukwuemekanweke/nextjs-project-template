import type { ApiClient } from "@template/api-client";
import { ApiError } from "@template/api-client";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  activeSessionsQueryOptions,
  changePasswordMutationOptions,
  disableTwoFactorMutationOptions,
  completeAvatarUploadMutationOptions,
  createAvatarUploadMutationOptions,
  getInfiniteQueryOptions,
  initiatePaymentMutationOptions,
  currentProfileQueryOptions,
  getQueryOptions,
  loginActivityQueryOptions,
  logoutMutationOptions,
  paymentKeys,
  profileKeys,
  queryClientDefaults,
  regenerateRecoveryCodesMutationOptions,
  revokeOtherSessionsMutationOptions,
  revokeSessionMutationOptions,
  shouldRetryQuery,
  updateProfileMutationOptions,
  twoFactorStatusQueryOptions,
  authenticationKeys,
  walletTopUpQueryOptions,
  walletTransactionsQueryOptions,
} from ".";

const createClient = () =>
  ({
    authentication: {
      changePassword: vi.fn().mockResolvedValue(undefined),
      disableTwoFactor: vi.fn().mockResolvedValue(undefined),
      getTwoFactorStatus: vi
        .fn()
        .mockResolvedValue({ enabled: true, recoveryCodesRemaining: 8 }),
      regenerateRecoveryCodes: vi
        .fn()
        .mockResolvedValue({ recoveryCodes: ["new-code"] }),
      listActiveSessions: vi.fn().mockResolvedValue([
        {
          sessionId: "session-1",
          deviceName: null,
          devicePlatform: "Windows",
          browserName: "Chrome",
          userAgent: "Mozilla/5.0",
          firstIpAddress: "143.105.174.121",
          lastIpAddress: "143.105.174.121",
          city: "Lagos",
          state: null,
          country: "Nigeria",
          createdAtUtc: "2026-09-20T10:00:00Z",
          lastActiveAtUtc: "2026-09-26T09:55:00Z",
          expiresAtUtc: "2026-10-20T10:00:00Z",
          isCurrent: true,
        },
      ]),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      revokeOtherSessions: vi.fn().mockResolvedValue(undefined),
      getLoginActivity: vi.fn().mockResolvedValue({
        activities: [],
        nextCursor: null,
      }),
    },
    profiles: {
      getProfile: vi.fn().mockResolvedValue({
        stakeholderId: "stakeholder-1",
        emailAddress: "user@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        avatarUrl: null,
        isVerified: true,
      }),
      updateProfile: vi.fn().mockResolvedValue(undefined),
      createAvatarUpload: vi.fn().mockResolvedValue({
        uploadId: "upload-1",
        uploadUrl: "https://signed-storage.test/avatar",
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        expiresAtUtc: "2026-09-24T10:05:00Z",
      }),
      completeAvatarUpload: vi.fn().mockResolvedValue({
        avatarUrl: "https://cdn.test/avatar.png",
      }),
    },
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
  it("submits password changes without retaining them in cached query data", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const options = changePasswordMutationOptions(client.authentication);
    const mutation = queryClient.getMutationCache().build(queryClient, options);
    const request = {
      confirmNewPassword: "NewPassword2!",
      currentPassword: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    };

    await mutation.execute(request);

    expect(client.authentication.changePassword).toHaveBeenCalledWith(request);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("creates stable hierarchical keys", () => {
    expect(authenticationKeys.twoFactorStatus()).toEqual([
      "authentication",
      "security",
      "two-factor",
    ]);
    expect(profileKeys.current()).toEqual(["profiles", "current"]);
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

  it("loads MFA status with query cancellation", async () => {
    const client = createClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await queryClient.fetchQuery(
      twoFactorStatusQueryOptions(client.authentication),
    );

    expect(client.authentication.getTwoFactorStatus).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it("updates MFA status without refetching after regenerating recovery codes", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    queryClient.setQueryData(authenticationKeys.twoFactorStatus(), {
      enabled: true,
      recoveryCodesRemaining: 2,
    });
    const mutation = queryClient
      .getMutationCache()
      .build(
        queryClient,
        regenerateRecoveryCodesMutationOptions(
          client.authentication,
          queryClient,
        ),
      );

    await mutation.execute({
      code: "123456",
      verificationMethod: "authenticator",
    });

    expect(
      queryClient.getQueryData(authenticationKeys.twoFactorStatus()),
    ).toEqual({
      enabled: true,
      recoveryCodesRemaining: 1,
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("updates MFA status without refetching after disabling it", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    queryClient.setQueryData(authenticationKeys.twoFactorStatus(), {
      enabled: true,
      recoveryCodesRemaining: 8,
    });
    const mutation = queryClient
      .getMutationCache()
      .build(
        queryClient,
        disableTwoFactorMutationOptions(client.authentication, queryClient),
      );

    await mutation.execute({
      code: "123456",
      verificationMethod: "authenticator",
    });

    expect(
      queryClient.getQueryData(authenticationKeys.twoFactorStatus()),
    ).toEqual({
      enabled: false,
      recoveryCodesRemaining: 0,
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("creates hierarchical keys for sessions and login activity", () => {
    expect(authenticationKeys.sessions()).toEqual([
      "authentication",
      "security",
      "sessions",
    ]);
    expect(authenticationKeys.loginActivityList({ Limit: 10 })).toEqual([
      "authentication",
      "security",
      "login-activity",
      "list",
      { Limit: 10 },
    ]);
  });

  it("loads active sessions with query cancellation", async () => {
    const client = createClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await queryClient.fetchQuery(
      activeSessionsQueryOptions(client.authentication),
    );

    expect(client.authentication.listActiveSessions).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it("invalidates active sessions after revoking one session", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const options = revokeSessionMutationOptions(
      client.authentication,
      queryClient,
    );
    const mutation = queryClient.getMutationCache().build(queryClient, options);

    await mutation.execute({ sessionId: "session-2" });

    expect(client.authentication.revokeSession).toHaveBeenCalledWith({
      sessionId: "session-2",
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: authenticationKeys.sessions(),
    });
  });

  it("invalidates active sessions after signing out every other session", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const options = revokeOtherSessionsMutationOptions(
      client.authentication,
      queryClient,
    );
    const mutation = queryClient.getMutationCache().build(queryClient, options);

    await mutation.execute();

    expect(client.authentication.revokeOtherSessions).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: authenticationKeys.sessions(),
    });
  });

  it("fetches login activity pages by cursor", async () => {
    const client = createClient();
    vi.mocked(client.authentication.getLoginActivity)
      .mockResolvedValueOnce({
        activities: [
          {
            id: "activity-1",
            activityType: "InitialLogin",
            occurredAtUtc: "2026-09-26T10:42:00Z",
            ipAddress: "143.105.174.121",
            deviceName: null,
            devicePlatform: "Windows",
            browserName: "Chrome",
            city: "Lagos",
            state: null,
            country: "Nigeria",
          },
        ],
        nextCursor: "cursor-2",
      })
      .mockResolvedValueOnce({ activities: [], nextCursor: null });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const options = loginActivityQueryOptions(client.authentication, 10);

    const result = await queryClient.fetchInfiniteQuery({
      ...options,
      pages: 2,
    });

    expect(client.authentication.getLoginActivity).toHaveBeenNthCalledWith(
      1,
      { Cursor: undefined, Limit: 10 },
      { signal: expect.any(AbortSignal) },
    );
    expect(client.authentication.getLoginActivity).toHaveBeenNthCalledWith(
      2,
      { Cursor: "cursor-2", Limit: 10 },
      { signal: expect.any(AbortSignal) },
    );
    expect(result.pages[0]?.nextCursor).toBe("cursor-2");
    expect(result.pages[1]?.nextCursor).toBeNull();
  });

  it("rejects non-GET operations from retryable infinite query options", () => {
    expect(() =>
      getInfiniteQueryOptions(
        {
          method: "POST",
          path: "/api/v1/authentication/sessions/others",
        } as unknown as { method: "GET"; path: string },
        {
          queryKey: ["unsafe-write"],
          queryFn: () => Promise.resolve(null),
          initialPageParam: undefined,
          getNextPageParam: () => undefined,
        },
      ),
    ).toThrow(
      "TanStack Query retries are restricted to GET operations; received POST /api/v1/authentication/sessions/others.",
    );
  });

  it("loads the current profile with query cancellation", async () => {
    const client = createClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await queryClient.fetchQuery(currentProfileQueryOptions(client.profiles));

    expect(client.profiles.getProfile).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it("invalidates the current profile after an update", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const options = updateProfileMutationOptions(client.profiles, queryClient);
    const mutation = queryClient.getMutationCache().build(queryClient, options);

    await mutation.execute({ firstName: "Ada", lastName: "Byron" });

    expect(client.profiles.updateProfile).toHaveBeenCalledWith({
      firstName: "Ada",
      lastName: "Byron",
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: profileKeys.current(),
    });
  });

  it("creates an avatar upload session through the profile client", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const options = createAvatarUploadMutationOptions(client.profiles);
    const mutation = queryClient.getMutationCache().build(queryClient, options);
    const request = {
      fileName: "portrait.png",
      contentType: "image/png",
      contentLength: 128,
    };

    await mutation.execute(request);

    expect(client.profiles.createAvatarUpload).toHaveBeenCalledWith(request);
  });

  it("invalidates the current profile after completing an avatar upload", async () => {
    const client = createClient();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const options = completeAvatarUploadMutationOptions(
      client.profiles,
      queryClient,
    );
    const mutation = queryClient.getMutationCache().build(queryClient, options);

    await mutation.execute({ uploadId: "upload-1" });

    expect(client.profiles.completeAvatarUpload).toHaveBeenCalledWith({
      uploadId: "upload-1",
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: profileKeys.current(),
    });
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

  it("clears cached server state when logout fails", async () => {
    const logout = vi.fn().mockRejectedValue(new Error("Session expired"));
    const queryClient = new QueryClient();
    const clear = vi.spyOn(queryClient, "clear");
    const options = logoutMutationOptions({ logout } as never, queryClient);
    const mutation = queryClient.getMutationCache().build(queryClient, options);

    await expect(mutation.execute()).rejects.toThrow("Session expired");
    expect(clear).toHaveBeenCalledOnce();
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
