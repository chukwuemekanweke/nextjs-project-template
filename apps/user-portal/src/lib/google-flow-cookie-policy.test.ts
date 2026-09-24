import { describe, expect, it } from "vitest";
import {
  expiredGoogleFlowCookie,
  GOOGLE_AUTH_FLOW_COOKIE,
  googleFlowCookie,
} from "./google-flow-cookie-policy";

describe("Google authentication flow cookie policy", () => {
  it("uses a host-prefixed name and short-lived secure attributes", () => {
    const options = googleFlowCookie("2030-01-02T03:04:05.000Z");

    expect(GOOGLE_AUTH_FLOW_COOKIE).toBe("__Host-user-google-auth-flow");
    expect(options).toMatchObject({
      expires: new Date("2030-01-02T03:04:05.000Z"),
      httpOnly: true,
      path: "/",
      priority: "high",
      sameSite: "lax",
      secure: true,
    });
    expect("domain" in options).toBe(false);
  });

  it("clears the cookie with the same host-only policy", () => {
    expect(expiredGoogleFlowCookie).toMatchObject({
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect("domain" in expiredGoogleFlowCookie).toBe(false);
  });
});
