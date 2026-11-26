import { ApiError } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import { createAvatarUploadGuard } from "./avatar-upload-guard";
import { submitProfileUpdate } from "./profile-update-submission";

function validationError(validationErrors: Record<string, string[]>) {
  return new ApiError({
    kind: "validation",
    safeMessage: "Some submitted values are invalid.",
    status: 400,
    validationErrors,
  });
}

describe("submitProfileUpdate", () => {
  it("sends trimmed names and reports success only after the mutation resolves", async () => {
    let resolveUpdate: () => void = () => undefined;
    const update = vi.fn(
      () => new Promise<void>((resolve) => (resolveUpdate = resolve)),
    );
    const setError = vi.fn();

    const result = submitProfileUpdate(
      { firstName: "  Grace ", lastName: " Hopper  " },
      { setError, update },
    );
    expect(update).toHaveBeenCalledWith({
      firstName: "Grace",
      lastName: "Hopper",
    });
    let settled = false;
    void result.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveUpdate();
    await expect(result).resolves.toEqual({
      status: "saved",
      values: { firstName: "Grace", lastName: "Hopper" },
    });
    expect(setError).not.toHaveBeenCalled();
  });

  it("maps backend field errors onto the form", async () => {
    const setError = vi.fn();
    const result = await submitProfileUpdate(
      { firstName: "G", lastName: "H" },
      {
        setError,
        update: vi
          .fn()
          .mockRejectedValue(
            validationError({ FirstName: ["First name is too short."] }),
          ),
      },
    );

    expect(result).toEqual({ status: "rejected" });
    expect(setError).toHaveBeenCalledWith("firstName", {
      message: "First name is too short.",
      type: "server",
    });
  });

  it("uses field fallbacks for a validation error without field details", async () => {
    const setError = vi.fn();
    const result = await submitProfileUpdate(
      { firstName: "G", lastName: "H" },
      { setError, update: vi.fn().mockRejectedValue(validationError({})) },
    );

    expect(result).toEqual({ status: "rejected" });
    expect(setError).toHaveBeenCalledWith("firstName", {
      message: "Enter your first name.",
      type: "server",
    });
    expect(setError).toHaveBeenCalledWith("lastName", {
      message: "Enter your last name.",
      type: "server",
    });
  });

  it("returns a general message for other failures", async () => {
    const result = await submitProfileUpdate(
      { firstName: "G", lastName: "H" },
      { setError: vi.fn(), update: vi.fn().mockRejectedValue(new Error("x")) },
    );
    expect(result).toEqual({
      message: "The request could not be completed.",
      status: "rejected",
    });
  });
});

describe("createAvatarUploadGuard", () => {
  it("reports a completed upload", async () => {
    const guard = createAvatarUploadGuard();
    await expect(guard.run(async () => ({ avatarUrl: "x" }))).resolves.toEqual({
      status: "uploaded",
    });
    expect(guard.active).toBe(false);
  });

  it("ignores a second upload while one is running", async () => {
    const guard = createAvatarUploadGuard();
    let finish: () => void = () => undefined;
    const first = guard.run(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const second = vi.fn();

    expect(guard.active).toBe(true);
    await expect(guard.run(second)).resolves.toEqual({ status: "ignored" });
    expect(second).not.toHaveBeenCalled();

    finish();
    await expect(first).resolves.toEqual({ status: "uploaded" });
    expect(guard.active).toBe(false);
  });

  it("reports upload or completion failures and allows a retry", async () => {
    const guard = createAvatarUploadGuard();
    await expect(
      guard.run(() =>
        Promise.reject(new Error("Avatar upload failed with status 403.")),
      ),
    ).resolves.toEqual({
      message: "Avatar upload failed with status 403.",
      status: "failed",
    });
    await expect(guard.run(() => Promise.reject("nope"))).resolves.toEqual({
      message: "Your profile photo could not be updated.",
      status: "failed",
    });
    expect(guard.active).toBe(false);
  });
});
