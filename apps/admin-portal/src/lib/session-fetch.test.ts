import { describe, expect, it, vi } from "vitest";
import { createPortalSessionFetch } from "./session-fetch";

const location = {
  hash: "#event",
  origin: "http://portal.test",
  pathname: "/audit",
  search: "?page=2",
};

describe("createPortalSessionFetch", () => {
  it("refreshes and retries an eligible same-origin request", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    const sessionFetch = createPortalSessionFetch({
      fetch,
      getLocation: () => location,
      redirect: vi.fn(),
    });

    await expect(
      sessionFetch("http://portal.test/api/audit"),
    ).resolves.toMatchObject({ status: 200 });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/auth/session/refresh", {
      credentials: "same-origin",
      method: "POST",
    });
  });

  it.each([
    "http://api.test/api/audit",
    "http://portal.test/api/auth/session/refresh",
    "http://portal.test/sign-in",
  ])("does not refresh an excluded request: %s", async (url) => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));
    const sessionFetch = createPortalSessionFetch({
      fetch,
      getLocation: () => location,
      redirect: vi.fn(),
    });

    await sessionFetch(url);

    expect(fetch).toHaveBeenCalledOnce();
  });

  it("clears the session and restores the current destination when refresh fails", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const redirect = vi.fn();
    const sessionFetch = createPortalSessionFetch({
      fetch,
      getLocation: () => location,
      redirect,
    });

    await sessionFetch("http://portal.test/api/audit");

    expect(fetch).toHaveBeenNthCalledWith(3, "/api/auth/session", {
      credentials: "same-origin",
      method: "DELETE",
    });
    expect(redirect).toHaveBeenCalledWith(
      "/sign-in?returnTo=%2Faudit%3Fpage%3D2%23event",
    );
  });
});
