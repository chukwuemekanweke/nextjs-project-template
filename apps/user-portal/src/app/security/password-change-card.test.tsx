import { ApiError } from "@template/api-client";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const useChangePassword = vi.fn();

vi.mock("@template/api-react/authentication", () => ({
  useChangePassword: () => useChangePassword(),
}));

import { PasswordChangeCard } from "./password-change-card";
import {
  submitPasswordChange,
  type PasswordChangeValues,
} from "./password-change-submission";

const values: PasswordChangeValues = {
  confirmNewPassword: "NewPassword2!",
  currentPassword: "CurrentPassword1!",
  newPassword: "NewPassword2!",
};

describe("PasswordChangeCard", () => {
  it("renders the inline change form with only supported controls", () => {
    useChangePassword.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    });

    const markup = renderToStaticMarkup(createElement(PasswordChangeCard));

    expect(markup).toContain("Change password");
    expect(markup).toContain('autoComplete="current-password"');
    expect(markup.match(/autoComplete="new-password"/g)).toHaveLength(2);
    expect(markup).toContain("Confirm new password");
    expect(markup).toContain('type="submit"');
    expect(markup).toContain("Update password");
    // Unsupported by the contract or out of scope (DR-053, FE-UI-020).
    expect(markup).not.toMatch(/sign out of all other sessions/i);
    expect(markup).not.toMatch(/last changed/i);
    expect(markup).not.toMatch(/forgot/i);
  });

  it("shows the submit button as busy while the change is pending", () => {
    useChangePassword.mockReturnValue({
      isPending: true,
      mutateAsync: vi.fn(),
    });

    const markup = renderToStaticMarkup(createElement(PasswordChangeCard));

    expect(markup).toMatch(/<button[^>]*aria-busy="true"[^>]*type="submit"/);
  });
});

describe("submitPasswordChange", () => {
  it("sends the validated values and reports success only after the backend accepts", async () => {
    const changePassword = vi.fn().mockResolvedValue(undefined);
    const setError = vi.fn();

    await expect(
      submitPasswordChange(values, { changePassword, setError }),
    ).resolves.toEqual({ status: "changed" });
    expect(changePassword).toHaveBeenCalledWith(values);
    expect(setError).not.toHaveBeenCalled();
  });

  it("maps backend validation onto the matching fields, including aliases", async () => {
    const changePassword = vi.fn().mockRejectedValue(
      new ApiError({
        kind: "validation",
        safeMessage: "Validation failed.",
        status: 400,
        validationErrors: {
          CurrentPassword: ["The current password is incorrect."],
          password: ["Passwords must have at least one digit."],
          confirmPassword: ["Passwords do not match."],
        },
      }),
    );
    const setError = vi.fn();

    await expect(
      submitPasswordChange(values, { changePassword, setError }),
    ).resolves.toEqual({ message: undefined, status: "failed" });
    expect(setError).toHaveBeenCalledWith("currentPassword", {
      message: "The current password is incorrect.",
      type: "server",
    });
    expect(setError).toHaveBeenCalledWith("newPassword", {
      message: "Passwords must have at least one digit.",
      type: "server",
    });
    expect(setError).toHaveBeenCalledWith("confirmNewPassword", {
      message: "Passwords do not match.",
      type: "server",
    });
  });

  it("keeps unmapped or non-validation failures form-level", async () => {
    const setError = vi.fn();

    await expect(
      submitPasswordChange(values, {
        changePassword: vi.fn().mockRejectedValue(
          new ApiError({
            kind: "rate-limited",
            safeMessage: "Too many requests. Try again later.",
            status: 429,
          }),
        ),
        setError,
      }),
    ).resolves.toEqual({
      message: "Too many requests. Try again later.",
      status: "failed",
    });
    await expect(
      submitPasswordChange(values, {
        changePassword: vi.fn().mockRejectedValue(new Error("socket hang up")),
        setError,
      }),
    ).resolves.toEqual({
      message: "The request could not be completed.",
      status: "failed",
    });
    expect(setError).not.toHaveBeenCalled();
  });
});
