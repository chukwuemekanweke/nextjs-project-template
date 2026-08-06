import { ApiError } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import { applyBackendValidation } from "./backend-validation";

type SignInValues = { email: string; password: string };

describe("applyBackendValidation", () => {
  it("maps case-insensitive backend keys to known fields", () => {
    const setError = vi.fn();
    const general = applyBackendValidation<SignInValues>(
      new ApiError({
        kind: "validation",
        safeMessage: "Invalid values",
        validationErrors: { Email: ["Email is already registered."] },
      }),
      setError,
      ["email", "password"],
    );

    expect(setError).toHaveBeenCalledWith("email", {
      message: "Email is already registered.",
      type: "server",
    });
    expect(general).toEqual([]);
  });

  it("keeps unknown backend keys as form-level errors", () => {
    const general = applyBackendValidation<SignInValues>(
      new ApiError({
        kind: "validation",
        safeMessage: "Invalid values",
        validationErrors: { Account: ["Account is locked."] },
      }),
      vi.fn(),
      ["email", "password"],
    );

    expect(general).toEqual(["Account is locked."]);
  });

  it("uses the safe API message when no field errors exist", () => {
    const general = applyBackendValidation<SignInValues>(
      new ApiError({ kind: "conflict", safeMessage: "Request conflicts." }),
      vi.fn(),
      ["email", "password"],
    );

    expect(general).toEqual(["Request conflicts."]);
  });
});
