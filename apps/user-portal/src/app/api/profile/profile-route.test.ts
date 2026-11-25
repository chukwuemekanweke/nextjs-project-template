import { ApiError } from "@template/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  serverClient: { server: true },
  updateProfile: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: () => Promise.resolve(mocks.serverClient),
}));
vi.mock("@template/api-client/profiles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@template/api-client/profiles")>()),
  getProfile: mocks.getProfile,
  updateProfile: mocks.updateProfile,
}));

import { GET, PUT } from "./route";

afterEach(() => vi.clearAllMocks());

describe("profile BFF route", () => {
  it("returns the signed-in user's profile with the session client", async () => {
    const profile = {
      avatarUrl: null,
      emailAddress: "ada@example.com",
      firstName: "Ada",
      isVerified: true,
      lastName: "Byron",
    };
    mocks.getProfile.mockResolvedValue(profile);

    const response = await GET();

    expect(mocks.getProfile).toHaveBeenCalledWith(mocks.serverClient);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(profile);
  });

  it("maps a backend failure to its status without leaking details", async () => {
    mocks.getProfile.mockRejectedValue(
      new ApiError({
        detail: "token expired at ...",
        kind: "unauthorized",
        safeMessage: "Sign in again.",
        status: 401,
      }),
    );

    const response = await GET();

    expect(response.status).toBe(401);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.detail).toBe("Sign in again.");
    expect(JSON.stringify(body)).not.toContain("token expired");
  });

  it("still forwards profile updates", async () => {
    mocks.updateProfile.mockResolvedValue(undefined);
    const response = await PUT(
      new Request("http://portal.test/api/profile", {
        body: JSON.stringify({ firstName: "Ada", lastName: "Byron" }),
        method: "PUT",
      }),
    );

    expect(response.status).toBe(204);
    expect(mocks.updateProfile).toHaveBeenCalledWith(mocks.serverClient, {
      firstName: "Ada",
      lastName: "Byron",
    });
  });
});
