import { describe, expect, it } from "vitest";
import { signInFeedback } from "./sign-in-feedback";
import { safeSignInError } from "./sign-in";

describe("admin signInFeedback", () => {
  it.each([
    [401, "Incorrect email or password", "error"],
    [403, "Access denied", "error"],
    [423, "Account locked", "error"],
    [429, "Too many requests", "warning"],
    [409, "Sign-in unavailable", "error"],
    [0, "Sign-in unavailable", "error"],
  ] as const)("maps %i to %s", (status, title, variant) => {
    expect(signInFeedback(status)).toEqual({
      message: safeSignInError(status),
      title,
      variant,
    });
  });
});
