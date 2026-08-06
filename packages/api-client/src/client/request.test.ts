import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ApiError } from "./api-error";
import { createApiClient } from "./request";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("createApiClient", () => {
  it("sends method, path, query, body, authentication, and request metadata", async () => {
    server.use(
      http.put("http://api.test/items/:id", async ({ params, request }) => {
        expect(params.id).toBe("item/1");
        expect(new URL(request.url).searchParams.getAll("tag")).toEqual([
          "one",
          "two",
        ]);
        expect(request.headers.get("authorization")).toBe(
          "Bearer access-token",
        );
        expect(request.headers.get("x-correlation-id")).toBe("correlation-id");
        expect(request.headers.get("content-type")).toContain(
          "application/json",
        );
        expect(await request.json()).toEqual({ enabled: true });
        return HttpResponse.json({ value: "ok" });
      }),
    );
    const client = createApiClient({
      baseUrl: "http://api.test/",
      getAccessToken: () => "access-token",
      getCorrelationId: () => "correlation-id",
    });

    await expect(
      client.request<{ value: string }>({
        body: { enabled: true },
        method: "PUT",
        path: "/items/{id}",
        pathParams: { id: "item/1" },
        query: { ignored: undefined, tag: ["one", "two"] },
      }),
    ).resolves.toEqual({ value: "ok" });
  });

  it("handles empty success responses", async () => {
    server.use(
      http.delete(
        "http://api.test/items/1",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const client = createApiClient({ baseUrl: "http://api.test" });
    await expect(
      client.request<void>({ method: "DELETE", path: "/items/1" }),
    ).resolves.toBeUndefined();
  });

  it("normalizes Problem Details and validation metadata", async () => {
    server.use(
      http.post("http://api.test/validate", () =>
        HttpResponse.json(
          {
            code: "invalid_request",
            detail: "The supplied request is invalid.",
            errors: { email: ["Email is required."] },
            extensions: { traceId: "trace-123" },
            title: "Validation failed",
            type: "https://example.test/problems/validation",
          },
          {
            headers: {
              "content-type": "application/problem+json",
              "retry-after": "30",
              "x-correlation-id": "correlation-123",
            },
            status: 422,
          },
        ),
      ),
    );
    const client = createApiClient({ baseUrl: "http://api.test" });

    await expect(
      client.request({ method: "POST", path: "/validate" }),
    ).rejects.toMatchObject({
      code: "invalid_request",
      correlationId: "correlation-123",
      detail: "The supplied request is invalid.",
      kind: "validation",
      retryAfter: "30",
      status: 422,
      traceId: "trace-123",
      validationErrors: { email: ["Email is required."] },
    });
  });

  it("preserves non-JSON error text without exposing it as the safe message", async () => {
    server.use(
      http.get(
        "http://api.test/text-error",
        () => new HttpResponse("upstream failure", { status: 502 }),
      ),
    );
    const client = createApiClient({ baseUrl: "http://api.test" });

    const error = await client
      .request({ method: "GET", path: "/text-error" })
      .catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      detail: "upstream failure",
      kind: "server",
      safeMessage: "The service is temporarily unavailable.",
    });
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not-found"],
    [409, "conflict"],
    [422, "validation"],
    [429, "rate-limited"],
    [500, "server"],
  ] as const)("normalizes HTTP %s as %s", async (status, kind) => {
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: async () =>
        Response.json(
          { title: "Backend title", traceId: "trace-status" },
          { status },
        ),
    });
    await expect(client.get("/status")).rejects.toMatchObject({
      isCancelled: false,
      isNetworkError: false,
      kind,
      status,
      title: "Backend title",
      traceId: "trace-status",
    });
  });

  it("handles invalid JSON safely", async () => {
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: async () =>
        new Response("{not-json", {
          headers: { "content-type": "application/json" },
          status: 502,
        }),
    });
    await expect(client.get("/invalid-json")).rejects.toMatchObject({
      kind: "unexpected",
      safeMessage: "The service returned an unreadable response.",
      status: 502,
    });
  });

  it("distinguishes timeouts, caller cancellation, and network failures", async () => {
    server.use(
      http.get("http://api.test/slow", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
      http.get("http://api.test/network", () => HttpResponse.error()),
    );
    const client = createApiClient({ baseUrl: "http://api.test" });
    await expect(
      client.request({ method: "GET", path: "/slow", timeoutMs: 5 }),
    ).rejects.toMatchObject({ kind: "timeout" });

    const controller = new AbortController();
    const pending = client.request({
      method: "GET",
      path: "/slow",
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: "cancelled" });
    await expect(
      client.request({ method: "GET", path: "/network" }),
    ).rejects.toMatchObject({ kind: "network" });
  });

  it("supports convenience methods and request-level correlation IDs", async () => {
    const requests: Array<{ method?: string; correlationId: string | null }> =
      [];
    const client = createApiClient({
      baseUrl: "http://api.test",
      fetch: async (_input, init) => {
        requests.push({
          correlationId: new Headers(init?.headers).get("x-correlation-id"),
          method: init?.method,
        });
        return new Response(null, { status: 204 });
      },
    });
    await client.get("/one", { correlationId: "caller-id" });
    await client.post("/two", { value: true });
    await client.put("/three", { value: true });
    await client.patch("/four", { value: true });
    await client.delete("/five");
    expect(requests.map(({ method }) => method)).toEqual([
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ]);
    expect(requests[0]?.correlationId).toBe("caller-id");
  });

  it("keeps configuration isolated between client instances", async () => {
    server.use(
      http.get("http://one.test/value", ({ request }) =>
        HttpResponse.json({ token: request.headers.get("authorization") }),
      ),
      http.get("http://two.test/value", ({ request }) =>
        HttpResponse.json({ token: request.headers.get("authorization") }),
      ),
    );
    const first = createApiClient({
      baseUrl: "http://one.test",
      getAccessToken: () => "one",
    });
    const second = createApiClient({
      baseUrl: "http://two.test",
      getAccessToken: () => "two",
    });

    await expect(
      Promise.all([
        first.request({ method: "GET", path: "/value" }),
        second.request({ method: "GET", path: "/value" }),
      ]),
    ).resolves.toEqual([{ token: "Bearer one" }, { token: "Bearer two" }]);
  });

  it("applies a default cache policy while allowing a request override", async () => {
    const cachePolicies: Array<RequestCache | undefined> = [];
    const client = createApiClient({
      baseUrl: "http://api.test",
      defaultCache: "no-store",
      fetch: async (_input, init) => {
        cachePolicies.push(init?.cache);
        return Response.json({ ok: true });
      },
    });

    await client.request({ method: "GET", path: "/default" });
    await client.request({
      cache: "force-cache",
      method: "GET",
      path: "/override",
    });

    expect(cachePolicies).toEqual(["no-store", "force-cache"]);
  });
});
