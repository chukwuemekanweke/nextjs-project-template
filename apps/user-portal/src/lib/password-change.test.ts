import { describe, expect, it } from "vitest";
import { passwordChangeSchema } from "./password-change";

const validPasswords = {
  confirmNewPassword: "NewPassword2!",
  currentPassword: "CurrentPassword1!",
  newPassword: "NewPassword2!",
};

describe("password change validation", () => {
  it("accepts current, new, and matching confirmation values", () => {
    expect(passwordChangeSchema.safeParse(validPasswords).success).toBe(true);
  });

  it.each([
    ["currentPassword", ""],
    ["newPassword", "password1!"],
    ["newPassword", "PASSWORD1!"],
    ["newPassword", "Password!"],
    ["newPassword", "Password1"],
    ["confirmNewPassword", "DifferentPassword2!"],
  ] as const)("rejects an invalid %s value", (field, value) => {
    expect(
      passwordChangeSchema.safeParse({ ...validPasswords, [field]: value })
        .success,
    ).toBe(false);
  });

  it("requires the new password to differ from the current password", () => {
    expect(
      passwordChangeSchema.safeParse({
        confirmNewPassword: validPasswords.currentPassword,
        currentPassword: validPasswords.currentPassword,
        newPassword: validPasswords.currentPassword,
      }).success,
    ).toBe(false);
  });
});
