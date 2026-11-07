import { ApiError } from "@template/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  completePasskeyAuthentication: vi.fn(),
  createPasskeyAuthenticationOptions: vi.fn(),
  flowCookie: undefined as string | undefined,
  setSessionCookies: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "__Host-user-passkey-sign-in-flow" && mocks.flowCookie
          ? { value: mocks.flowCookie }
          : undefined,
    }),
  headers: () => Promise.resolve(new Headers()),
}));
vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: () => Promise.resolve({}),
}));
vi.mock("@/lib/session-cookies", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/session-cookies")>();
  return {
    ...original,
    setSessionCookies: (
      ...args: Parameters<typeof original.setSessionCookies>
    ) => {
      mocks.setSessionCookies(...args);
      original.setSessionCookies(...args);
    },
  };
});
vi.mock("@template/api-client/authentication", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@template/api-client/authentication")
  >()),
  completePasskeyAuthentication: mocks.completePasskeyAuthentication,
  createPasskeyAuthenticationOptions: mocks.createPasskeyAuthenticationOptions,
}));

import { POST as startPasskeySignIn } from "../passkey/options/route";
import {
  DELETE as cancelPasskeySignIn,
  POST as completePasskeySignIn,
} from "./passkey/route";

const assertion = {
  clientExtensionResults: {},
  id: "AQ",
  rawId: "AQ",
  response: { authenticatorData: "BQ", clientDataJSON: "BA", signature: "Bw" },
  type: "public-key",
};

const session = {
  accessToken: "access-secret",
  accessTokenExpiresAtUtc: "2026-11-07T11:00:00Z",
  outcome: "authenticated" as const,
  refreshToken: "refresh-secret",
  refreshTokenExpiresAtUtc: "2026-12-07T11:00:00Z",
  tokenType: "Bearer",
};

function completionRequest(body: unknown = { credential: assertion }) {
  return new Request("http://portal.test/api/auth/session/passkey", {
    body: JSON.stringify(body),
    method: "POST",
  });
}

function setCookies(response: Response): string {
  return response.headers.get("set-cookie") ?? "";
}

afterEach(() => {
  vi.clearAllMocks();
  mocks.flowCookie = undefined;
});

describe("passkey sign-in BFF routes", () => {
  it("keeps the flow token in an HttpOnly cookie and returns only public options", async () => {
    mocks.createPasskeyAuthenticationOptions.mockResolvedValue({
      expiresAtUtc: "2026-11-07T10:05:00Z",
      flowToken: "opaque-flow",
      publicKey: { challenge: "AQID", userVerification: "preferred" },
    });

    const response = await startPasskeySignIn();
    const payload = await response.json();

    expect(payload).toEqual({
      expiresAtUtc: "2026-11-07T10:05:00Z",
      publicKey: { challenge: "AQID", userVerification: "preferred" },
    });
    expect(JSON.stringify(payload)).not.toContain("opaque-flow");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const cookies = setCookies(response);
    expect(cookies).toContain("__Host-user-passkey-sign-in-flow=opaque-flow");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("Secure");
    expect(cookies.toLowerCase()).toContain("samesite=lax");
  });

  it("forwards the assertion with the cookie-held flow and sets the normal session cookies", async () => {
    mocks.flowCookie = "opaque-flow";
    mocks.completePasskeyAuthentication.mockResolvedValue(session);

    const response = await completePasskeySignIn(completionRequest());
    const payload = await response.json();

    expect(mocks.completePasskeyAuthentication).toHaveBeenCalledWith(
      {},
      { credential: assertion, flowToken: "opaque-flow" },
    );
    expect(payload).toEqual({
      expiresAtUtc: session.accessTokenExpiresAtUtc,
      status: "authenticated",
      tokenType: "Bearer",
    });
    expect(JSON.stringify(payload)).not.toMatch(/access-secret|refresh-secret/);
    expect(mocks.setSessionCookies).toHaveBeenCalledWith(expect.anything(), {
      accessToken: "access-secret",
      expiresAtUtc: session.accessTokenExpiresAtUtc,
      refreshToken: "refresh-secret",
      refreshTokenExpiresAtUtc: session.refreshTokenExpiresAtUtc,
      tokenType: "Bearer",
    });
    const cookies = setCookies(response);
    expect(cookies).toContain("__Host-user-session=access-secret");
    expect(cookies).toContain("__Host-user-refresh-session=refresh-secret");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toMatch(/__Host-user-passkey-sign-in-flow=;/);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("hands a two-factor outcome to the existing challenge cookie without a session", async () => {
    mocks.flowCookie = "opaque-flow";
    mocks.completePasskeyAuthentication.mockResolvedValue({
      challenge: "mfa-challenge",
      challengeExpiresAtUtc: "2026-11-07T10:10:00Z",
      outcome: "two_factor_required",
    });

    const response = await completePasskeySignIn(completionRequest());
    const payload = await response.json();

    expect(payload).toEqual({
      expiresAtUtc: "2026-11-07T10:10:00Z",
      status: "two_factor_required",
    });
    expect(JSON.stringify(payload)).not.toContain("mfa-challenge");
    const cookies = setCookies(response);
    expect(cookies).toContain("__Host-user-two-factor-challenge=");
    expect(cookies).not.toContain("access-secret");
    expect(mocks.setSessionCookies).not.toHaveBeenCalled();
    expect(cookies).toMatch(/__Host-user-passkey-sign-in-flow=;/);
  });

  it.each([
    [401, "invalid assertion"],
    [409, "replayed flow"],
    [410, "expired flow"],
    [423, "locked account"],
    [403, "email not verified"],
  ])(
    "returns %s (%s) without a session and clears the single-use flow",
    async (status) => {
      mocks.flowCookie = "opaque-flow";
      mocks.completePasskeyAuthentication.mockRejectedValue(
        new ApiError({
          kind: status === 401 ? "unauthorized" : "conflict",
          safeMessage: "Passkey failed",
          status,
          title: "Passkey failed",
        }),
      );

      const response = await completePasskeySignIn(completionRequest());

      expect(response.status).toBe(status);
      expect(mocks.setSessionCookies).not.toHaveBeenCalled();
      const cookies = setCookies(response);
      expect(cookies).not.toContain("__Host-user-session=");
      expect(cookies).toMatch(/__Host-user-passkey-sign-in-flow=;/);
    },
  );

  it("rejects completion without a flow cookie before calling the backend", async () => {
    const response = await completePasskeySignIn(completionRequest());

    expect(response.status).toBe(400);
    expect(mocks.completePasskeyAuthentication).not.toHaveBeenCalled();
    expect(setCookies(response)).not.toContain("__Host-user-session=");
  });

  it.each([{}, { credential: "not-an-object" }, { credential: [] }])(
    "rejects a malformed credential payload %#",
    async (body) => {
      mocks.flowCookie = "opaque-flow";
      const response = await completePasskeySignIn(completionRequest(body));

      expect(response.status).toBe(400);
      expect(mocks.completePasskeyAuthentication).not.toHaveBeenCalled();
      expect(setCookies(response)).toMatch(
        /__Host-user-passkey-sign-in-flow=;/,
      );
    },
  );

  it("clears the flow cookie when the browser abandons sign-in", () => {
    const response = cancelPasskeySignIn();

    expect(response.status).toBe(204);
    expect(setCookies(response)).toMatch(/__Host-user-passkey-sign-in-flow=;/);
  });
});
