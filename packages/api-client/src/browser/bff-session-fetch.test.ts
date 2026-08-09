import { describe, expect, it, vi } from "vitest";
import {
  createBffSessionFetch,
  type BffSessionFetchOptions,
  type BrowserLocation,
} from "./bff-session-fetch";

const location: BrowserLocation = {
  hash: "#security",
  origin: "http://portal.test",
  pathname: "/account",
  search: "?tab=profile",
};

function createSessionFetch(
  fetch: typeof globalThis.fetch,
  overrides: Partial<BffSessionFetchOptions> = {},
) {
  return createBffSessionFetch({
    authenticationPathPrefix: "/api/auth/",
    fetch,
    getLocation: () => location,
    redirect: vi.fn(),
    sessionPath: "/api/auth/session",
    signInPath: "/sign-in",
    ...overrides,
  });
}

describe("createBffSessionFetch", () => {
  it("refreshes and retries an eligible same-origin request", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    const sessionFetch = createSessionFetch(fetch);

    await expect(
      sessionFetch("http://portal.test/api/account"),
    ).resolves.toMatchObject({ status: 200 });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/auth/session/refresh", {
      credentials: "same-origin",
      method: "POST",
    });
  });

  it.each([
    "http://api.test/api/account",
    "http://portal.test/api/auth/session/refresh",
    "http://portal.test/sign-in",
    "http://[invalid",
  ])("does not refresh an excluded request: %s", async (url) => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));
    const sessionFetch = createSessionFetch(fetch);

    await sessionFetch(url);

    expect(fetch).toHaveBeenCalledOnce();
  });

  it("logs out and retains the complete current destination on expiry", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const redirect = vi.fn();
    const sessionFetch = createSessionFetch(fetch, { redirect });

    await sessionFetch("http://portal.test/api/account");

    expect(fetch).toHaveBeenNthCalledWith(3, "/api/auth/session", {
      credentials: "same-origin",
      method: "DELETE",
    });
    expect(redirect).toHaveBeenCalledWith(
      "/sign-in?returnTo=%2Faccount%3Ftab%3Dprofile%23security",
    );
  });

  it("redirects even when best-effort logout fails", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce(new Error("logout unavailable"));
    const redirect = vi.fn();
    const sessionFetch = createSessionFetch(fetch, { redirect });

    await sessionFetch("http://portal.test/api/account");

    expect(redirect).toHaveBeenCalledWith(
      "/sign-in?returnTo=%2Faccount%3Ftab%3Dprofile%23security",
    );
  });

  it("does not nest returnTo when expiry happens on the sign-in page", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const redirect = vi.fn();
    const sessionFetch = createSessionFetch(fetch, {
      getLocation: () => ({
        ...location,
        pathname: "/sign-in",
        search: "?returnTo=%2Faccount",
      }),
      redirect,
    });

    await sessionFetch("http://portal.test/api/account");

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });
});
