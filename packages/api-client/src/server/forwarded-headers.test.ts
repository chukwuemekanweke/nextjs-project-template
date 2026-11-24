import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createForwardedRequestHeaders, readForwardedClientIp } =
  await import("./forwarded-headers");

describe("readForwardedClientIp", () => {
  it("reads the address the reverse proxy added", () => {
    expect(
      readForwardedClientIp(new Headers({ "x-forwarded-for": "203.0.113.7" })),
    ).toBe("203.0.113.7");
  });

  it("uses the last entry so a browser-supplied value is ignored", () => {
    expect(
      readForwardedClientIp(
        new Headers({ "x-forwarded-for": "10.0.0.1, 2001:db8::1" }),
      ),
    ).toBe("2001:db8::1");
  });

  it("ignores missing or malformed values", () => {
    expect(readForwardedClientIp(new Headers())).toBeUndefined();
    expect(
      readForwardedClientIp(new Headers({ "x-forwarded-for": "not-an-ip" })),
    ).toBeUndefined();
  });
});

describe("createForwardedRequestHeaders", () => {
  it("forwards tracing headers and the browser IP", () => {
    expect(
      createForwardedRequestHeaders(
        new Headers({
          cookie: "session=secret",
          traceparent: "00-trace-span-01",
          "user-agent": "Browser",
          "x-correlation-id": "correlation-1",
          "x-forwarded-for": "198.51.100.4",
        }),
      ),
    ).toEqual({
      traceparent: "00-trace-span-01",
      "user-agent": "Browser",
      "x-correlation-id": "correlation-1",
      "x-forwarded-for": "198.51.100.4",
    });
  });

  it("omits headers the request does not carry", () => {
    expect(createForwardedRequestHeaders(new Headers())).toEqual({});
  });
});
