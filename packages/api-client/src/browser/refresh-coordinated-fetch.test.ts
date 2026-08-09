import { describe, expect, it, vi } from "vitest";
import { createRefreshCoordinatedFetch } from "./refresh-coordinated-fetch";

const protectedRequest = "http://portal.test/api/account";

describe("createRefreshCoordinatedFetch", () => {
  it("retries a 401 once after a successful refresh", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    const refreshSession = vi.fn().mockResolvedValue(true);
    const onSessionExpired = vi.fn();
    const coordinatedFetch = createRefreshCoordinatedFetch({
      fetch,
      onSessionExpired,
      refreshSession,
      shouldRefreshRequest: () => true,
    });

    await expect(coordinatedFetch(protectedRequest)).resolves.toMatchObject({
      status: 200,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("clones a Request so a queued retry keeps its body", async () => {
    const bodies: string[] = [];
    const fetch = vi.fn<typeof globalThis.fetch>(async (input) => {
      bodies.push(await (input as Request).text());
      return new Response(null, { status: bodies.length === 1 ? 401 : 204 });
    });
    const coordinatedFetch = createRefreshCoordinatedFetch({
      fetch,
      onSessionExpired: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(true),
      shouldRefreshRequest: () => true,
    });

    await coordinatedFetch(
      new Request(protectedRequest, { body: "request-body", method: "POST" }),
    );

    expect(bodies).toEqual(["request-body", "request-body"]);
  });

  it("shares one refresh while concurrent 401 requests wait", async () => {
    let finishRefresh: ((value: boolean) => void) | undefined;
    const refreshPending = new Promise<boolean>((resolve) => {
      finishRefresh = resolve;
    });
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValue(Response.json({ ok: true }));
    const refreshSession = vi.fn(() => refreshPending);
    const coordinatedFetch = createRefreshCoordinatedFetch({
      fetch,
      onSessionExpired: vi.fn(),
      refreshSession,
      shouldRefreshRequest: () => true,
    });

    const first = coordinatedFetch("http://portal.test/api/first");
    const second = coordinatedFetch("http://portal.test/api/second");
    await vi.waitFor(() => expect(refreshSession).toHaveBeenCalledOnce());
    finishRefresh?.(true);

    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ status: 200 }),
      expect.objectContaining({ status: 200 }),
    ]);
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("uses a completed concurrent refresh for a late 401 response", async () => {
    let finishLateRequest: ((response: Response) => void) | undefined;
    const lateResponse = new Promise<Response>((resolve) => {
      finishLateRequest = resolve;
    });
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockImplementationOnce(() => lateResponse)
      .mockResolvedValue(Response.json({ ok: true }));
    const refreshSession = vi.fn().mockResolvedValue(true);
    const coordinatedFetch = createRefreshCoordinatedFetch({
      fetch,
      onSessionExpired: vi.fn(),
      refreshSession,
      shouldRefreshRequest: () => true,
    });

    const first = coordinatedFetch("http://portal.test/api/first");
    const late = coordinatedFetch("http://portal.test/api/late");
    await first;
    finishLateRequest?.(new Response(null, { status: 401 }));
    await late;

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("expires the session once when refresh fails", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));
    const refreshSession = vi.fn().mockResolvedValue(false);
    const onSessionExpired = vi.fn();
    const coordinatedFetch = createRefreshCoordinatedFetch({
      fetch,
      onSessionExpired,
      refreshSession,
      shouldRefreshRequest: () => true,
    });

    await Promise.all([
      coordinatedFetch("http://portal.test/api/first"),
      coordinatedFetch("http://portal.test/api/second"),
    ]);
    await coordinatedFetch("http://portal.test/api/third");

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("does not refresh again when the retried request returns 401", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));
    const refreshSession = vi.fn().mockResolvedValue(true);
    const onSessionExpired = vi.fn();
    const coordinatedFetch = createRefreshCoordinatedFetch({
      fetch,
      onSessionExpired,
      refreshSession,
      shouldRefreshRequest: () => true,
    });

    await coordinatedFetch(protectedRequest);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("passes through requests that are not eligible for refresh", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));
    const refreshSession = vi.fn().mockResolvedValue(true);
    const coordinatedFetch = createRefreshCoordinatedFetch({
      fetch,
      onSessionExpired: vi.fn(),
      refreshSession,
      shouldRefreshRequest: () => false,
    });

    await coordinatedFetch(protectedRequest);

    expect(fetch).toHaveBeenCalledOnce();
    expect(refreshSession).not.toHaveBeenCalled();
  });
});
