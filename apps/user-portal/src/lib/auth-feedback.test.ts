import { describe, expect, it } from "vitest";
import {
  googleFeedback,
  passkeyFeedback,
  passwordResetFeedback,
  passwordResetResentFeedback,
  signInFeedback,
  twoFactorFeedback,
} from "./auth-feedback";
import { googleAuthenticationError } from "./google-authentication";

describe("signInFeedback", () => {
  it.each([
    [401, "Incorrect email or password", "error"],
    [423, "Account locked", "error"],
    [429, "Too many requests", "warning"],
    [500, "Sign-in unavailable", "error"],
    [0, "Sign-in unavailable", "error"],
  ] as const)("maps %i to %s", (status, title, variant) => {
    expect(signInFeedback(status)).toMatchObject({ title, variant });
  });

  it("never invents attempt counts or lockout durations", () => {
    for (const status of [401, 423, 429]) {
      const { message, title } = signInFeedback(status);
      expect(`${title} ${message}`).not.toMatch(/\d/);
    }
  });
});

describe("googleFeedback", () => {
  it("titles failures from the backend's stable error codes", () => {
    expect(
      googleFeedback(googleAuthenticationError("account_locked", 423)),
    ).toMatchObject({ title: "Account locked", variant: "error" });
    expect(
      googleFeedback(googleAuthenticationError("rate_limited", 429)),
    ).toMatchObject({ title: "Too many requests", variant: "warning" });
    expect(
      googleFeedback(
        googleAuthenticationError("email_verification_required", 403),
      ),
    ).toMatchObject({ title: "Email not confirmed", variant: "warning" });
    expect(
      googleFeedback(googleAuthenticationError("invalid_credentials", 401)),
    ).toMatchObject({ title: "Incorrect password" });
  });

  it("uses a generic title for expired flows and unknown failures", () => {
    const expired = googleAuthenticationError("google_flow_expired", 410);
    expect(googleFeedback(expired)).toEqual({
      message: expired.message,
      title: "Google sign-in failed",
      variant: "error",
    });
    expect(
      googleFeedback({ message: "Offline", restartRequired: false }).title,
    ).toBe("Google sign-in failed");
  });
});

describe("passkeyFeedback", () => {
  it("keeps the status-specific passkey message", () => {
    expect(passkeyFeedback("The passkey request expired. Try again.")).toEqual({
      message: "The passkey request expired. Try again.",
      title: "Passkey sign-in failed",
      variant: "error",
    });
  });
});

describe("twoFactorFeedback", () => {
  it("names the rejected code type", () => {
    expect(
      twoFactorFeedback({ message: "x", method: "authenticator", status: 401 })
        .title,
    ).toBe("Invalid authenticator code");
    expect(
      twoFactorFeedback({
        message: "That verification code is incorrect. Try again.",
        method: "recovery_code",
        status: 401,
      }),
    ).toEqual({
      message: "That verification code is incorrect. Try again.",
      title: "Invalid recovery code",
      variant: "error",
    });
  });

  it("maps rate limiting and other failures", () => {
    expect(
      twoFactorFeedback({ message: "x", method: "authenticator", status: 429 }),
    ).toMatchObject({ title: "Too many attempts", variant: "warning" });
    expect(
      twoFactorFeedback({ message: "x", method: "authenticator", status: 503 }),
    ).toMatchObject({ title: "Verification unavailable", variant: "error" });
  });
});

describe("passwordResetFeedback", () => {
  it("states one combined outcome for a wrong, expired or used code", () => {
    expect(passwordResetFeedback("invalid_code", "complete")).toEqual({
      message:
        "It's wrong, expired or already used. Use Resend code to get a new one.",
      title: "That code didn't work",
      variant: "error",
    });
  });

  it("separates request failures from completion failures", () => {
    expect(passwordResetFeedback("unavailable", "request").title).toBe(
      "We couldn't send a code",
    );
    expect(passwordResetFeedback("unavailable", "resend").title).toBe(
      "We couldn't send a code",
    );
    expect(passwordResetFeedback("unavailable", "complete").title).toBe(
      "We couldn't confirm your password reset",
    );
    expect(passwordResetFeedback("rate_limited", "complete")).toMatchObject({
      title: "Too many requests",
      variant: "warning",
    });
  });

  it("does not claim an outcome it cannot know after a lost response", () => {
    const { message, title } = passwordResetFeedback("unavailable", "complete");
    expect(`${title} ${message}`).not.toMatch(
      /wasn't changed|not changed|unchanged|was reset|succeeded|failed/i,
    );
    expect(message).toContain("try signing in with your new password");
  });

  it("never reveals account existence, attempts or a fabricated timer", () => {
    const copy = JSON.stringify([
      ...(["invalid_code", "rate_limited", "unavailable"] as const).flatMap(
        (failure) =>
          (["complete", "request", "resend"] as const).map((operation) =>
            passwordResetFeedback(failure, operation),
          ),
      ),
      passwordResetResentFeedback,
    ]);
    expect(copy).not.toMatch(/no account|not found|attempts? left|\d+ ?min/i);
  });
});
