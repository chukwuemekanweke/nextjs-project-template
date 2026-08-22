import { describe, expect, it } from "vitest";
import {
  confirmationSchema,
  normalizeRegistrationEmail,
  passwordSchema,
  profileSchema,
  retrySecondsRemaining,
  safeRetryAtUtc,
} from "./registration";

describe("registration validation", () => {
  it.each(["password1!", "PASSWORD1!", "Password!", "Password1", "Pass1!"])(
    "rejects a password that misses a backend policy: %s",
    (password) => {
      expect(
        passwordSchema.safeParse({ confirmPassword: password, password })
          .success,
      ).toBe(false);
    },
  );

  it("accepts a matching password that satisfies every backend policy", () => {
    expect(
      passwordSchema.safeParse({
        confirmPassword: "Password1!",
        password: "Password1!",
      }).success,
    ).toBe(true);
  });

  it("requires matching passwords", () => {
    const result = passwordSchema.safeParse({
      confirmPassword: "Different1!",
      password: "Password1!",
    });
    expect(result.success).toBe(false);
  });

  it("matches backend profile and confirmation constraints", () => {
    expect(
      profileSchema.safeParse({ countryId: "", firstName: "", lastName: "" })
        .success,
    ).toBe(false);
    expect(confirmationSchema.safeParse({ otp: "12345" }).success).toBe(false);
    expect(confirmationSchema.safeParse({ otp: "123456" }).success).toBe(true);
  });

  it("normalizes email before API calls and navigation", () => {
    expect(normalizeRegistrationEmail("  Ada@Example.COM ")).toBe(
      "ada@example.com",
    );
  });

  it("validates retry timestamps and calculates the remaining cooldown", () => {
    expect(safeRetryAtUtc("not-a-date")).toBe("");
    expect(safeRetryAtUtc("2026-08-22T10:05:00Z")).toBe(
      "2026-08-22T10:05:00.000Z",
    );
    expect(
      retrySecondsRemaining(
        "2026-08-22T10:05:00Z",
        Date.parse("2026-08-22T10:04:30Z"),
      ),
    ).toBe(30);
    expect(
      retrySecondsRemaining(
        "2026-08-22T10:05:00Z",
        Date.parse("2026-08-22T10:06:00Z"),
      ),
    ).toBe(0);
  });
});
