import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  changePassword,
  checkEmailExistence,
  completeTwoFactorChallenge,
  confirmEmail,
  disableTwoFactor,
  getLoginActivity,
  getTwoFactorStatus,
  linkGoogleAccount,
  listActiveSessions,
  requestEmailConfirmationCode,
  regenerateRecoveryCodes,
  revokeOtherSessions,
  revokeSession,
  signIn,
  signInWithGoogle,
  signUp,
  signUpWithGoogle,
  startGoogleAuthenticationFlow,
  setupTwoFactor,
  verifyTwoFactorEnrollment,
} from "./authentication";
import { createApiClient } from "./client";
import { getWalletTopUpTransaction, getWalletTransactions } from "./payments";
import {
  completeAvatarUpload,
  createAvatarUpload,
  getProfile,
  updateProfile,
} from "./profiles";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("handwritten API operations", () => {
  it("changes the authenticated user's password", async () => {
    const passwordChange = {
      confirmNewPassword: "NewPassword2!",
      currentPassword: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    };
    server.use(
      http.put(
        "http://api.test/api/v1/authentication/password",
        async ({ request }) => {
          expect(await request.json()).toEqual(passwordChange);
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    await expect(
      changePassword(
        createApiClient({ baseUrl: "http://api.test" }),
        passwordChange,
      ),
    ).resolves.toBeUndefined();
  });

  it("checks whether an email is already registered", async () => {
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/email-existence-checks",
        async ({ request }) => {
          expect(await request.json()).toEqual({ email: "user@example.com" });
          return HttpResponse.json({ exists: true });
        },
      ),
    );

    await expect(
      checkEmailExistence(createApiClient({ baseUrl: "http://api.test" }), {
        email: "user@example.com",
      }),
    ).resolves.toEqual({ exists: true });
  });

  it("submits the complete registration contract", async () => {
    const registration = {
      confirmPassword: "Password1!",
      countryId: "country-id",
      email: "user@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      password: "Password1!",
    };
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/registrations",
        async ({ request }) => {
          expect(await request.json()).toEqual(registration);
          return HttpResponse.json(
            {
              email: registration.email,
              message: "Confirmation sent",
              retryAtUtc: "2026-08-22T10:05:00Z",
            },
            { status: 202 },
          );
        },
      ),
    );

    await expect(
      signUp(createApiClient({ baseUrl: "http://api.test" }), registration),
    ).resolves.toEqual({
      email: registration.email,
      message: "Confirmation sent",
      retryAtUtc: "2026-08-22T10:05:00Z",
    });
  });

  it("requests another email confirmation code", async () => {
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/email-confirmations/confirmation-code",
        async ({ request }) => {
          expect(await request.json()).toEqual({ email: "user@example.com" });
          return HttpResponse.json({
            message: "Confirmation code requested",
            retryAtUtc: "2026-08-22T10:10:00Z",
          });
        },
      ),
    );

    await expect(
      requestEmailConfirmationCode(
        createApiClient({ baseUrl: "http://api.test" }),
        { email: "user@example.com" },
      ),
    ).resolves.toEqual({
      message: "Confirmation code requested",
      retryAtUtc: "2026-08-22T10:10:00Z",
    });
  });

  it("returns a session after confirming an email", async () => {
    const session = {
      accessToken: "access",
      expiresAtUtc: "2026-08-22T13:00:00Z",
      refreshToken: "refresh",
      refreshTokenExpiresAtUtc: "2026-09-21T13:00:00Z",
      tokenType: "Bearer",
    };
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/email-confirmations",
        async ({ request }) => {
          expect(await request.json()).toEqual({
            email: "user@example.com",
            otp: "123456",
          });
          return HttpResponse.json(session);
        },
      ),
    );

    await expect(
      confirmEmail(createApiClient({ baseUrl: "http://api.test" }), {
        email: "user@example.com",
        otp: "123456",
      }),
    ).resolves.toEqual(session);
  });

  it("signs in with the contract request and response", async () => {
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/sessions",
        async ({ request }) => {
          expect(await request.json()).toEqual({
            email: "user@example.com",
            password: "Password1!",
          });
          return HttpResponse.json({
            accessToken: "access",
            expiresAtUtc: "2026-08-01T00:00:00Z",
            outcome: "authenticated",
            refreshToken: "refresh",
            refreshTokenExpiresAtUtc: "2026-08-31T00:00:00Z",
            tokenType: "Bearer",
          });
        },
      ),
    );
    const result = await signIn(
      createApiClient({ baseUrl: "http://api.test" }),
      {
        email: "user@example.com",
        password: "Password1!",
      },
    );
    expect(result).toMatchObject({
      accessToken: "access",
      outcome: "authenticated",
    });
  });

  it("returns an opaque challenge instead of tokens when two-factor authentication is required", async () => {
    server.use(
      http.post("http://api.test/api/v1/authentication/sessions", () =>
        HttpResponse.json({
          challenge: "opaque-challenge",
          challengeExpiresAtUtc: "2026-09-25T10:05:00Z",
          outcome: "two_factor_required",
        }),
      ),
    );

    await expect(
      signIn(createApiClient({ baseUrl: "http://api.test" }), {
        email: "user@example.com",
        password: "Password1!",
      }),
    ).resolves.toEqual({
      challenge: "opaque-challenge",
      challengeExpiresAtUtc: "2026-09-25T10:05:00Z",
      outcome: "two_factor_required",
    });
  });

  it("completes a two-factor challenge and manages authenticator security", async () => {
    const client = createApiClient({ baseUrl: "http://api.test" });
    const proof = {
      code: "123456",
      verificationMethod: "authenticator" as const,
    };
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/sessions/two-factor",
        async ({ request }) => {
          expect(await request.json()).toEqual({
            challenge: "opaque-challenge",
            ...proof,
          });
          return HttpResponse.json({
            accessToken: "access",
            expiresAtUtc: "2026-09-25T11:00:00Z",
            outcome: "authenticated",
            refreshToken: "refresh",
            refreshTokenExpiresAtUtc: "2026-10-25T11:00:00Z",
            tokenType: "Bearer",
          });
        },
      ),
      http.get(
        "http://api.test/api/v1/authentication/security/two-factor",
        () => HttpResponse.json({ enabled: true, recoveryCodesRemaining: 8 }),
      ),
      http.post(
        "http://api.test/api/v1/authentication/security/two-factor/setup",
        () =>
          HttpResponse.json({
            authenticatorUri: "otpauth://totp/Portal:user%40example.com",
            sharedKey: "SECRET",
          }),
      ),
      http.post(
        "http://api.test/api/v1/authentication/security/two-factor/verify",
        async ({ request }) => {
          expect(await request.json()).toEqual({ code: "123456" });
          return HttpResponse.json({ recoveryCodes: ["code-one"] });
        },
      ),
      http.post(
        "http://api.test/api/v1/authentication/security/two-factor/recovery-codes",
        async ({ request }) => {
          expect(await request.json()).toEqual(proof);
          return HttpResponse.json({ recoveryCodes: ["code-two"] });
        },
      ),
      http.post(
        "http://api.test/api/v1/authentication/security/two-factor/disable",
        async ({ request }) => {
          expect(await request.json()).toEqual(proof);
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    await expect(
      completeTwoFactorChallenge(client, {
        challenge: "opaque-challenge",
        ...proof,
      }),
    ).resolves.toMatchObject({ outcome: "authenticated" });
    await expect(getTwoFactorStatus(client)).resolves.toEqual({
      enabled: true,
      recoveryCodesRemaining: 8,
    });
    await expect(setupTwoFactor(client)).resolves.toMatchObject({
      sharedKey: "SECRET",
    });
    await expect(
      verifyTwoFactorEnrollment(client, { code: "123456" }),
    ).resolves.toEqual({ recoveryCodes: ["code-one"] });
    await expect(regenerateRecoveryCodes(client, proof)).resolves.toEqual({
      recoveryCodes: ["code-two"],
    });
    await expect(disableTwoFactor(client, proof)).resolves.toBeUndefined();
  });

  it("starts and continues the Google authentication flow", async () => {
    const client = createApiClient({ baseUrl: "http://api.test" });
    server.use(
      http.post("http://api.test/api/v1/authentication/google/flows", () =>
        HttpResponse.json(
          {
            expiresAtUtc: "2026-09-24T10:10:00Z",
            flowToken: "opaque-flow-token",
            nonce: "google-nonce",
          },
          { status: 201 },
        ),
      ),
      http.post(
        "http://api.test/api/v1/authentication/sessions/google",
        async ({ request }) => {
          expect(await request.json()).toEqual({
            flowToken: "opaque-flow-token",
            idToken: "google-id-token",
          });
          return HttpResponse.json({ outcome: "link_required" });
        },
      ),
    );

    await expect(startGoogleAuthenticationFlow(client)).resolves.toEqual({
      expiresAtUtc: "2026-09-24T10:10:00Z",
      flowToken: "opaque-flow-token",
      nonce: "google-nonce",
    });
    await expect(
      signInWithGoogle(client, {
        flowToken: "opaque-flow-token",
        idToken: "google-id-token",
      }),
    ).resolves.toEqual({ outcome: "link_required" });
  });

  it("links Google and completes Google registration with application sessions", async () => {
    const session = {
      accessToken: "access",
      expiresAtUtc: "2026-09-24T11:00:00Z",
      outcome: "authenticated" as const,
      refreshToken: "refresh",
      refreshTokenExpiresAtUtc: "2026-10-24T11:00:00Z",
      tokenType: "Bearer",
    };
    const client = createApiClient({ baseUrl: "http://api.test" });
    server.use(
      http.post(
        "http://api.test/api/v1/authentication/google-links",
        async ({ request }) => {
          expect(await request.json()).toEqual({
            flowToken: "opaque-flow-token",
            password: "Password1!",
          });
          return HttpResponse.json(session);
        },
      ),
      http.post(
        "http://api.test/api/v1/authentication/registrations/google",
        async ({ request }) => {
          expect(await request.json()).toEqual({
            countryId: "country-id",
            firstName: "Ada",
            flowToken: "opaque-flow-token",
            lastName: "Lovelace",
          });
          return HttpResponse.json({ ...session, email: "ada@example.com" });
        },
      ),
    );

    await expect(
      linkGoogleAccount(client, {
        flowToken: "opaque-flow-token",
        password: "Password1!",
      }),
    ).resolves.toEqual(session);
    await expect(
      signUpWithGoogle(client, {
        countryId: "country-id",
        firstName: "Ada",
        flowToken: "opaque-flow-token",
        lastName: "Lovelace",
      }),
    ).resolves.toEqual({ ...session, email: "ada@example.com" });
  });

  it("serializes wallet query and path parameters", async () => {
    server.use(
      http.get(
        "http://api.test/api/v1/payments/wallet-transactions",
        ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("Limit")).toBe("25");
          expect(url.searchParams.get("Cursor")).toBe("next");
          return HttpResponse.json({ nextCursor: null, transactions: [] });
        },
      ),
      http.get(
        "http://api.test/api/v1/payments/wallet-transactions/top-ups/:id",
        ({ params }) => {
          expect(params.id).toBe("transaction-id");
          return HttpResponse.json({
            amount: 20,
            currencyCode: "NGN",
            description: null,
            merchantReference: "merchant-ref",
            paymentMethodType: "bank-transfer",
            paymentProviderName: "Provider",
            timestamp: "2026-07-31T00:00:00Z",
            transactionTitle: "Top up",
            walletTransactionId: "transaction-id",
          });
        },
      ),
    );
    const client = createApiClient({ baseUrl: "http://api.test" });
    await expect(
      getWalletTransactions(client, { Cursor: "next", Limit: 25 }),
    ).resolves.toEqual({ nextCursor: null, transactions: [] });
    await expect(
      getWalletTopUpTransaction(client, {
        walletTransactionId: "transaction-id",
      }),
    ).resolves.toMatchObject({ walletTransactionId: "transaction-id" });
  });

  it("creates and completes an avatar upload session", async () => {
    const uploadId = "1d130feb-40d9-4ec9-9957-3827dfe02dc5";
    const createRequest = {
      fileName: "portrait.png",
      contentType: "image/png",
      contentLength: 128,
    };
    server.use(
      http.post(
        "http://api.test/api/v1/stakeholders/me/profile/avatar/uploads",
        async ({ request }) => {
          expect(request.headers.get("content-type")).toContain(
            "application/json",
          );
          expect(await request.json()).toEqual(createRequest);
          return HttpResponse.json({
            uploadId,
            uploadUrl: "https://signed-storage.test/avatar",
            method: "PUT",
            headers: { "Content-Type": "image/png" },
            expiresAtUtc: "2026-09-24T10:05:00Z",
          });
        },
      ),
      http.post(
        "http://api.test/api/v1/stakeholders/me/profile/avatar/uploads/:uploadId/complete",
        ({ params }) => {
          expect(params.uploadId).toBe(uploadId);
          return HttpResponse.json({
            avatarUrl: "https://cdn.test/avatar.png",
          });
        },
      ),
    );
    const client = createApiClient({ baseUrl: "http://api.test" });

    await expect(createAvatarUpload(client, createRequest)).resolves.toEqual({
      uploadId,
      uploadUrl: "https://signed-storage.test/avatar",
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      expiresAtUtc: "2026-09-24T10:05:00Z",
    });
    await expect(completeAvatarUpload(client, { uploadId })).resolves.toEqual({
      avatarUrl: "https://cdn.test/avatar.png",
    });
  });

  it("gets the authenticated stakeholder profile", async () => {
    const profile = {
      stakeholderId: "stakeholder-1",
      emailAddress: "user@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      avatarUrl: null,
      isVerified: true,
    };
    server.use(
      http.get("http://api.test/api/v1/stakeholders/me/profile", () =>
        HttpResponse.json(profile),
      ),
    );

    await expect(
      getProfile(createApiClient({ baseUrl: "http://api.test" })),
    ).resolves.toEqual(profile);
  });

  it("lists active sessions and revokes an individual session", async () => {
    const client = createApiClient({ baseUrl: "http://api.test" });
    const session = {
      sessionId: "session-1",
      deviceName: "Pixel 8",
      devicePlatform: "Android",
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
      isCurrent: false,
    };
    server.use(
      http.get("http://api.test/api/v1/authentication/sessions", () =>
        HttpResponse.json([session]),
      ),
      http.delete(
        "http://api.test/api/v1/authentication/sessions/:sessionId",
        ({ params }) => {
          expect(params.sessionId).toBe("session-1");
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    await expect(listActiveSessions(client)).resolves.toEqual([session]);
    await expect(
      revokeSession(client, { sessionId: "session-1" }),
    ).resolves.toBeUndefined();
  });

  it("revokes every other active session", async () => {
    const client = createApiClient({ baseUrl: "http://api.test" });
    server.use(
      http.delete(
        "http://api.test/api/v1/authentication/sessions/others",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(revokeOtherSessions(client)).resolves.toBeUndefined();
  });

  it("paginates recent login activity by cursor", async () => {
    const client = createApiClient({ baseUrl: "http://api.test" });
    const activity = {
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
    };
    server.use(
      http.get(
        "http://api.test/api/v1/stakeholders/me/login-activity",
        ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("Cursor")).toBe("cursor-1");
          expect(url.searchParams.get("Limit")).toBe("10");
          return HttpResponse.json({
            activities: [activity],
            nextCursor: "cursor-2",
          });
        },
      ),
    );

    await expect(
      getLoginActivity(client, { Cursor: "cursor-1", Limit: 10 }),
    ).resolves.toEqual({ activities: [activity], nextCursor: "cursor-2" });
  });

  it("updates the authenticated stakeholder profile", async () => {
    const profileUpdate = { firstName: "Ada", lastName: "Byron" };
    server.use(
      http.put(
        "http://api.test/api/v1/stakeholders/me/profile",
        async ({ request }) => {
          expect(await request.json()).toEqual(profileUpdate);
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    await expect(
      updateProfile(
        createApiClient({ baseUrl: "http://api.test" }),
        profileUpdate,
      ),
    ).resolves.toBeUndefined();
  });
});
