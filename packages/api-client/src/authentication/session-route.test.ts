import { describe, expect, it, vi } from "vitest";
import {
  createSessionRefreshCoordinator,
  createSignInRedirectUrl,
  decodeAccessTokenPayload,
  hasActiveAccessToken,
  resolveRouteSession,
} from "./session-route";

const token = (payload: Record<string, unknown>) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

describe("route session resolution", () => {
  it("accepts an active access token without refreshing", async () => {
    const refreshSession = vi.fn();

    await expect(
      resolveRouteSession({
        accessToken: "active",
        isAccessTokenValid: () => true,
        refreshSession,
        refreshToken: "refresh",
      }),
    ).resolves.toEqual({ status: "active" });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("renews a route session when the access token is unavailable", async () => {
    const session = { accessToken: "rotated" };
    const refreshSession = vi.fn().mockResolvedValue(session);

    await expect(
      resolveRouteSession({
        isAccessTokenValid: () => false,
        refreshSession,
        refreshToken: "refresh",
      }),
    ).resolves.toEqual({ session, status: "refreshed" });
    expect(refreshSession).toHaveBeenCalledWith("refresh");
  });

  it("rejects missing or failed session renewal", async () => {
    await expect(
      resolveRouteSession({
        isAccessTokenValid: () => false,
        refreshSession: vi.fn(),
      }),
    ).resolves.toEqual({ status: "unauthenticated" });
    await expect(
      resolveRouteSession({
        isAccessTokenValid: () => false,
        refreshSession: vi.fn().mockRejectedValue(new Error("Expired")),
        refreshToken: "expired",
      }),
    ).resolves.toEqual({ status: "unauthenticated" });
  });
});

describe("createSessionRefreshCoordinator", () => {
  it("shares one rotating refresh operation between concurrent guards", async () => {
    const coordinateRefresh = createSessionRefreshCoordinator<{ id: string }>();
    const refreshSession = vi.fn().mockResolvedValue({ id: "rotated" });

    const sessions = await Promise.all([
      coordinateRefresh("refresh-token", refreshSession),
      coordinateRefresh("refresh-token", refreshSession),
    ]);

    expect(sessions).toEqual([{ id: "rotated" }, { id: "rotated" }]);
    expect(refreshSession).toHaveBeenCalledOnce();
  });

  it("allows a later refresh after the active operation settles", async () => {
    const coordinateRefresh = createSessionRefreshCoordinator<string>();
    const refreshSession = vi.fn().mockResolvedValue("rotated");

    await coordinateRefresh("refresh-token", refreshSession);
    await coordinateRefresh("refresh-token", refreshSession);

    expect(refreshSession).toHaveBeenCalledTimes(2);
  });
});

describe("access token inspection", () => {
  const now = new Date("2030-01-02T03:04:05.000Z");

  it("accepts a structurally valid token within its time window", () => {
    const accessToken = token({
      exp: Math.floor(now.getTime() / 1_000) + 60,
      name: "Ọlá",
      nbf: Math.floor(now.getTime() / 1_000) - 60,
    });

    expect(hasActiveAccessToken(accessToken, now)).toBe(true);
    expect(decodeAccessTokenPayload(accessToken)?.name).toBe("Ọlá");
  });

  it.each([
    "malformed",
    token({}),
    token({ exp: Math.floor(now.getTime() / 1_000) }),
    token({
      exp: Math.floor(now.getTime() / 1_000) + 60,
      nbf: Math.floor(now.getTime() / 1_000) + 30,
    }),
    token({
      exp: Math.floor(now.getTime() / 1_000) + 60,
      nbf: "later",
    }),
  ])("rejects an unusable token: %s", (accessToken) => {
    expect(hasActiveAccessToken(accessToken, now)).toBe(false);
  });
});

describe("createSignInRedirectUrl", () => {
  it("keeps the intended local path and query on the portal origin", () => {
    const redirect = createSignInRedirectUrl(
      new URL("https://user.test/payments?page=2"),
      "/sign-in",
    );

    expect(redirect.toString()).toBe(
      "https://user.test/sign-in?returnTo=%2Fpayments%3Fpage%3D2",
    );
  });
});
