import { ApiError } from "@template/api-client";
import { describe, expect, it } from "vitest";
import {
  normalizeProfileUpdate,
  profileUpdateFallbackMessages,
  profileUpdateSchema,
} from "./profile-editing";

describe("profile editing", () => {
  it("matches the backend name requirements", () => {
    expect(
      profileUpdateSchema.safeParse({ firstName: "", lastName: "Lovelace" })
        .success,
    ).toBe(false);
    expect(
      profileUpdateSchema.safeParse({
        firstName: "Ada",
        lastName: "x".repeat(101),
      }).success,
    ).toBe(false);
    expect(
      profileUpdateSchema.safeParse({
        firstName: "Ada",
        lastName: "Lovelace",
      }).success,
    ).toBe(true);
  });

  it("trims names before sending the update", () => {
    expect(
      normalizeProfileUpdate({
        firstName: "  Ada ",
        lastName: " Lovelace  ",
      }),
    ).toEqual({ firstName: "Ada", lastName: "Lovelace" });
  });

  it("maps the backend's plain validation response to editable fields", () => {
    expect(
      profileUpdateFallbackMessages(
        new ApiError({
          detail: "FirstName and LastName are required.",
          kind: "validation",
          safeMessage: "Some submitted values are invalid.",
          status: 400,
        }),
      ),
    ).toEqual({
      firstName: "Enter your first name.",
      lastName: "Enter your last name.",
    });
  });

  it("leaves structured backend field errors to shared mapping", () => {
    expect(
      profileUpdateFallbackMessages(
        new ApiError({
          kind: "validation",
          safeMessage: "Some submitted values are invalid.",
          validationErrors: { FirstName: ["First name is invalid."] },
        }),
      ),
    ).toBeUndefined();
  });
});
