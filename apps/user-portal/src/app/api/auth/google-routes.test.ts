import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@template/api-client";

const mocks = vi.hoisted(() => ({
  cookieValue: "opaque-flow-token" as string | undefined,
  linkGoogleAccount: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUpWithGoogle: vi.fn(),
  startGoogleAuthenticationFlow: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: () => (mocks.cookieValue ? { value: mocks.cookieValue } : undefined),
    }),
  headers: () => Promise.resolve(new Headers()),
}));
vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: () => Promise.resolve({}),
}));
vi.mock("@template/api-client/authentication", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@template/api-client/authentication")
  >()),
  linkGoogleAccount: mocks.linkGoogleAccount,
  signInWithGoogle: mocks.signInWithGoogle,
  signUpWithGoogle: mocks.signUpWithGoogle,
  startGoogleAuthenticationFlow: mocks.startGoogleAuthenticationFlow,
}));

import { POST as startFlow } from "./google/flow/route";
import { POST as linkGoogle } from "./google/link/route";
import { POST as registerGoogle } from "./registrations/google/route";
import { POST as authenticateGoogle } from "./session/google/route";

const session = {
  accessToken: "access-secret",
  expiresAtUtc: "2026-09-24T11:00:00Z",
  outcome: "authenticated" as const,
  refreshToken: "refresh-secret",
  refreshTokenExpiresAtUtc: "2026-10-24T11:00:00Z",
  tokenType: "Bearer",
};

afterEach(() => {
  vi.clearAllMocks();
  mocks.cookieValue = "opaque-flow-token";
});

describe("Google authentication BFF routes", () => {
  it("starts a flow, stores its token in HttpOnly cookie, and returns no token", async () => {
    mocks.startGoogleAuthenticationFlow.mockResolvedValue({
      expiresAtUtc: "2026-09-24T10:10:00Z",
      flowToken: "opaque-flow-token",
      nonce: "google-nonce",
    });

    const response = await startFlow();

    await expect(response.json()).resolves.toEqual({
      expiresAtUtc: "2026-09-24T10:10:00Z",
      nonce: "google-nonce",
    });
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-user-google-auth-flow=opaque-flow-token",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("creates a normal cookie session without returning application tokens", async () => {
    mocks.signInWithGoogle.mockResolvedValue(session);

    const response = await authenticateGoogle(
      new Request("http://portal.test/api/auth/session/google", {
        body: JSON.stringify({ credential: "google-id-token" }),
        method: "POST",
      }),
    );

    expect(mocks.signInWithGoogle).toHaveBeenCalledWith(
      {},
      {
        flowToken: "opaque-flow-token",
        idToken: "google-id-token",
      },
    );
    const payload = await response.json();
    expect(payload).toEqual({
      expiresAtUtc: session.expiresAtUtc,
      status: "authenticated",
      tokenType: "Bearer",
    });
    expect(payload).not.toHaveProperty("accessToken");
    expect(payload).not.toHaveProperty("refreshToken");
    const cookies = response.headers.get("set-cookie") ?? "";
    expect(cookies).toContain("__Host-user-session=access-secret");
    expect(cookies).toContain("__Host-user-refresh-session=refresh-secret");
    expect(cookies).toContain("__Host-user-google-auth-flow=");
  });

  it.each(["link_required", "registration_required"] as const)(
    "preserves the flow cookie for %s",
    async (outcome) => {
      mocks.signInWithGoogle.mockResolvedValue({ outcome });

      const response = await authenticateGoogle(
        new Request("http://portal.test/api/auth/session/google", {
          body: JSON.stringify({ credential: "google-id-token" }),
          method: "POST",
        }),
      );

      await expect(response.json()).resolves.toEqual({ status: outcome });
      expect(response.headers.get("set-cookie")).toBeNull();
    },
  );

  it("links with only the browser password and clears the flow", async () => {
    mocks.linkGoogleAccount.mockResolvedValue(session);

    const response = await linkGoogle(
      new Request("http://portal.test/api/auth/google/link", {
        body: JSON.stringify({ password: "Password1!" }),
        method: "POST",
      }),
    );

    expect(mocks.linkGoogleAccount).toHaveBeenCalledWith(
      {},
      {
        flowToken: "opaque-flow-token",
        password: "Password1!",
      },
    );
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-user-google-auth-flow=",
    );
  });

  it("registers with profile fields only and creates the cookie session", async () => {
    mocks.signUpWithGoogle.mockResolvedValue({
      ...session,
      email: "ada@example.com",
    });

    const response = await registerGoogle(
      new Request("http://portal.test/api/auth/registrations/google", {
        body: JSON.stringify({
          countryId: "country-id",
          firstName: "Ada",
          lastName: "Lovelace",
        }),
        method: "POST",
      }),
    );

    expect(mocks.signUpWithGoogle).toHaveBeenCalledWith(
      {},
      {
        countryId: "country-id",
        firstName: "Ada",
        flowToken: "opaque-flow-token",
        lastName: "Lovelace",
      },
    );
    const payload = await response.json();
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("accessToken");
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-user-session=access-secret",
    );
  });

  it("rejects continuation when the HttpOnly flow cookie is absent", async () => {
    mocks.cookieValue = undefined;

    const response = await linkGoogle(
      new Request("http://portal.test/api/auth/google/link", {
        body: JSON.stringify({ password: "Password1!" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "google_flow_invalid",
    });
    expect(mocks.linkGoogleAccount).not.toHaveBeenCalled();
  });

  it("expires the flow cookie after a backend expired-flow response", async () => {
    mocks.signInWithGoogle.mockRejectedValue(
      new ApiError({
        code: "google_flow_expired",
        kind: "unexpected",
        safeMessage: "The request could not be completed.",
        status: 410,
      }),
    );

    const response = await authenticateGoogle(
      new Request("http://portal.test/api/auth/session/google", {
        body: JSON.stringify({ credential: "google-id-token" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(410);
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-user-google-auth-flow=",
    );
  });
});
