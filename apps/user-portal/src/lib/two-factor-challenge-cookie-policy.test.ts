import { describe, expect, it } from "vitest";
import {
  expiredTwoFactorChallengeCookie,
  TWO_FACTOR_CHALLENGE_COOKIE,
  twoFactorChallengeCookie,
} from "./two-factor-challenge-cookie-policy";

describe("two-factor challenge cookie policy", () => {
  it("uses a short-lived secure host cookie", () => {
    const expiresAtUtc = "2026-09-25T10:05:00Z";
    expect(TWO_FACTOR_CHALLENGE_COOKIE).toBe(
      "__Host-user-two-factor-challenge",
    );
    expect(twoFactorChallengeCookie(expiresAtUtc)).toMatchObject({
      expires: new Date(expiresAtUtc),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect(expiredTwoFactorChallengeCookie.maxAge).toBe(0);
  });
});
