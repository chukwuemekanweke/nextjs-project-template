import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_COOKIE,
  expiredSessionCookie,
  persistentSessionCookie,
  REFRESH_TOKEN_COOKIE,
  TOKEN_EXPIRY_SAFETY_WINDOW_SECONDS,
} from "./session-cookie-policy";

describe("admin session cookie policy", () => {
  it("uses distinct host-prefixed cookie names", () => {
    expect(ACCESS_TOKEN_COOKIE).toBe("__Host-admin-session");
    expect(REFRESH_TOKEN_COOKIE).toBe("__Host-admin-refresh-session");
    expect(ACCESS_TOKEN_COOKIE).not.toBe(REFRESH_TOKEN_COOKIE);
  });

  it("creates persistent, host-only secure HttpOnly cookies", () => {
    const expiresAtUtc = "2030-01-02T03:04:05.000Z";
    const options = persistentSessionCookie(expiresAtUtc);

    expect(options).toMatchObject({
      expires: new Date("2030-01-02T03:03:05.000Z"),
      httpOnly: true,
      path: "/",
      priority: "high",
      sameSite: "lax",
      secure: true,
    });
    expect("domain" in options).toBe(false);
    expect(TOKEN_EXPIRY_SAFETY_WINDOW_SECONDS).toBe(60);
  });

  it("expires cookies with the same security attributes", () => {
    expect(expiredSessionCookie).toMatchObject({
      httpOnly: true,
      maxAge: 0,
      path: "/",
      secure: true,
    });
    expect("domain" in expiredSessionCookie).toBe(false);
  });
});
