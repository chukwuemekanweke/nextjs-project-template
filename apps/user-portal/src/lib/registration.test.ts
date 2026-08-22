import { describe, expect, it } from "vitest";
import {
  confirmationSchema,
  normalizeRegistrationEmail,
  passwordSchema,
  profileSchema,
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
});
