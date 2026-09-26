import { describe, expect, it } from "vitest";
import {
  TERMINAL_TWO_FACTOR_CODES,
  twoFactorErrorFromResponse,
} from "./two-factor";

describe("two-factor browser errors", () => {
  it.each([
    "two_factor_challenge_consumed",
    "two_factor_challenge_exhausted",
    "two_factor_challenge_expired",
    "two_factor_challenge_invalid",
  ])("requires restart for terminal code %s", async (code) => {
    expect(TERMINAL_TWO_FACTOR_CODES.has(code)).toBe(true);
    await expect(
      twoFactorErrorFromResponse(Response.json({ code }, { status: 400 })),
    ).resolves.toMatchObject({ restartRequired: true });
  });

  it("keeps incorrect authenticator and recovery-code failures retryable", async () => {
    await expect(
      twoFactorErrorFromResponse(
        Response.json(
          { code: "invalid_two_factor_code", detail: "sensitive" },
          { status: 401 },
        ),
      ),
    ).resolves.toEqual({
      message: "That verification code is incorrect. Try again.",
      restartRequired: false,
    });
  });

  it("maps lockout and rate limiting to safe messages", async () => {
    await expect(
      twoFactorErrorFromResponse(
        Response.json({ code: "account_locked" }, { status: 423 }),
      ),
    ).resolves.toMatchObject({ restartRequired: true });
    await expect(
      twoFactorErrorFromResponse(
        Response.json({ code: "rate_limited" }, { status: 429 }),
      ),
    ).resolves.toMatchObject({ restartRequired: false });
  });
});
