import { ApiError } from "@template/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  challengeCookie: undefined as string | undefined,
  completeTwoFactorChallenge: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "__Host-user-two-factor-challenge" && mocks.challengeCookie
          ? { value: mocks.challengeCookie }
          : undefined,
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
  completeTwoFactorChallenge: mocks.completeTwoFactorChallenge,
  signIn: mocks.signIn,
}));

import {
  DELETE as cancelTwoFactor,
  POST as completeTwoFactor,
} from "./two-factor/route";
import { POST as passwordSignIn } from "./route";

const session = {
  accessToken: "access-secret",
  expiresAtUtc: "2026-09-25T11:00:00Z",
  outcome: "authenticated" as const,
  refreshToken: "refresh-secret",
  refreshTokenExpiresAtUtc: "2026-10-25T11:00:00Z",
  tokenType: "Bearer",
};

function challengeCookie() {
  return Buffer.from(
    JSON.stringify({
      challenge: "opaque-challenge",
      expiresAtUtc: "2026-09-25T10:05:00Z",
    }),
  ).toString("base64url");
}

afterEach(() => {
  vi.clearAllMocks();
  mocks.challengeCookie = undefined;
});

describe("two-factor session BFF routes", () => {
  it("keeps the normal password session path token-safe", async () => {
    mocks.signIn.mockResolvedValue(session);
    const response = await passwordSignIn(
      new Request("http://portal.test/api/auth/session", {
        body: JSON.stringify({ email: "user@example.com", password: "secret" }),
        method: "POST",
      }),
    );

    const payload = await response.json();
    expect(payload).toEqual({
      expiresAtUtc: session.expiresAtUtc,
      status: "authenticated",
      tokenType: "Bearer",
    });
    expect(payload).not.toHaveProperty("accessToken");
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-user-session=access-secret",
    );
  });

  it("stores an MFA-required password challenge without setting session tokens", async () => {
    mocks.signIn.mockResolvedValue({
      challenge: "opaque-challenge",
      challengeExpiresAtUtc: "2026-09-25T10:05:00Z",
      outcome: "two_factor_required",
    });
    const response = await passwordSignIn(
      new Request("http://portal.test/api/auth/session", {
        body: JSON.stringify({ email: "user@example.com", password: "secret" }),
        method: "POST",
      }),
    );

    const payload = await response.json();
    expect(payload).toEqual({
      expiresAtUtc: "2026-09-25T10:05:00Z",
      status: "two_factor_required",
    });
    expect(JSON.stringify(payload)).not.toContain("opaque-challenge");
    const cookies = response.headers.get("set-cookie") ?? "";
    expect(cookies).toContain("__Host-user-two-factor-challenge=");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).not.toContain("__Host-user-session=access-secret");
    expect(cookies).not.toContain("__Host-user-refresh-session=refresh-secret");
  });

  it.each(["authenticator", "recovery_code"] as const)(
    "reads the challenge server-side and completes with %s",
    async (verificationMethod) => {
      mocks.challengeCookie = challengeCookie();
      mocks.completeTwoFactorChallenge.mockResolvedValue(session);
      const response = await completeTwoFactor(
        new Request("http://portal.test/api/auth/session/two-factor", {
          body: JSON.stringify({ code: "proof", verificationMethod }),
          method: "POST",
        }),
      );

      expect(mocks.completeTwoFactorChallenge).toHaveBeenCalledWith(
        {},
        {
          challenge: "opaque-challenge",
          code: "proof",
          verificationMethod,
        },
      );
      expect(response.headers.get("set-cookie")).toContain(
        "__Host-user-session=access-secret",
      );
      expect(response.headers.get("set-cookie")).toContain(
        "__Host-user-two-factor-challenge=",
      );
    },
  );

  it("keeps the challenge after an incorrect code but clears terminal challenges", async () => {
    mocks.challengeCookie = challengeCookie();
    mocks.completeTwoFactorChallenge.mockRejectedValueOnce(
      new ApiError({
        code: "invalid_two_factor_code",
        kind: "unauthorized",
        safeMessage: "Invalid",
        status: 401,
      }),
    );
    const request = () =>
      new Request("http://portal.test/api/auth/session/two-factor", {
        body: JSON.stringify({
          code: "000000",
          verificationMethod: "authenticator",
        }),
        method: "POST",
      });

    const retryable = await completeTwoFactor(request());
    expect(retryable.headers.get("set-cookie")).toBeNull();

    mocks.completeTwoFactorChallenge.mockRejectedValueOnce(
      new ApiError({
        code: "two_factor_challenge_expired",
        kind: "unexpected",
        safeMessage: "Expired",
        status: 410,
      }),
    );
    const terminal = await completeTwoFactor(request());
    expect(terminal.headers.get("set-cookie")).toContain(
      "__Host-user-two-factor-challenge=",
    );
  });

  it("clears the challenge when sign-in is cancelled", async () => {
    const response = await cancelTwoFactor();
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-user-two-factor-challenge=",
    );
  });
});
