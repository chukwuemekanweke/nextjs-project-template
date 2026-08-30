import { describe, expect, it, vi } from "vitest";
import { createPortalSessionFetch } from "./session-fetch";

const location = {
  hash: "#security",
  origin: "http://portal.test",
  pathname: "/account",
  search: "?tab=profile",
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
      sessionFetch("http://portal.test/api/account"),
    ).resolves.toMatchObject({ status: 200 });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/auth/session/refresh", {
      credentials: "same-origin",
      method: "POST",
    });
  });

  it("refreshes and retries the password-change BFF request", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const sessionFetch = createPortalSessionFetch({
      fetch,
      getLocation: () => location,
      redirect: vi.fn(),
    });

    await expect(
      sessionFetch("http://portal.test/api/security/password", {
        body: JSON.stringify({
          confirmNewPassword: "NewPassword2!",
          currentPassword: "CurrentPassword1!",
          newPassword: "NewPassword2!",
        }),
        method: "PUT",
      }),
    ).resolves.toMatchObject({ status: 204 });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/auth/session/refresh", {
      credentials: "same-origin",
      method: "POST",
    });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it.each([
    "http://api.test/api/account",
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

    await sessionFetch("http://portal.test/api/account");

    expect(fetch).toHaveBeenNthCalledWith(3, "/api/auth/session", {
      credentials: "same-origin",
      method: "DELETE",
    });
    expect(redirect).toHaveBeenCalledWith(
      "/sign-in?returnTo=%2Faccount%3Ftab%3Dprofile%23security",
    );
  });
});
