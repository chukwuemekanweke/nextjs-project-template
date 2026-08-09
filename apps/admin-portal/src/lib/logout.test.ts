import { describe, expect, it, vi } from "vitest";
import { logoutPortalSession } from "./logout";

describe("logoutPortalSession", () => {
  it("terminates the backend session, clears private data, and opens sign-in", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const cancelPrivateRequests = vi.fn().mockResolvedValue(undefined);
    const clearPrivateData = vi.fn();
    const redirect = vi.fn();

    await logoutPortalSession({
      cancelPrivateRequests,
      clearPrivateData,
      fetch,
      redirect,
    });

    expect(cancelPrivateRequests).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith("/api/auth/session", {
      credentials: "same-origin",
      method: "DELETE",
    });
    expect(clearPrivateData).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it.each([
    new Response(null, { status: 401 }),
    new TypeError("Network unavailable"),
  ])("finishes local logout when backend termination fails", async (result) => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    if (result instanceof Response) {
      fetch.mockResolvedValue(result);
    } else {
      fetch.mockRejectedValue(result);
    }
    const clearPrivateData = vi.fn();
    const redirect = vi.fn();

    await logoutPortalSession({
      cancelPrivateRequests: vi.fn().mockRejectedValue(new Error("Cancelled")),
      clearPrivateData,
      fetch,
      redirect,
    });

    expect(clearPrivateData).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });
});
