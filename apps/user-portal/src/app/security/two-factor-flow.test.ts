import { ApiError } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import {
  CLOSED_SETUP_DIALOG,
  canFinishSetup,
  enrollmentSchema,
  groupSetupKey,
  isSetupDismissible,
  proofSchema,
  recoveryCodesFileContents,
  setupDialogReducer,
  setupStepLabel,
  submitTwoFactorProof,
  twoFactorStatusError,
  verifyEnrollment,
  type SetupDialogState,
} from "./two-factor-flow";

// Test-only values; never real credentials.
const TEST_CODES = ["AAAAA11111", "BBBBB22222"];

const apiError = (status: number, safeMessage = "Request failed.") =>
  new ApiError({ kind: "unexpected", safeMessage, status });

describe("two-factor setup dialog steps", () => {
  it("walks through the three steps: explain, scan and verify, save codes", () => {
    let state: SetupDialogState = setupDialogReducer(CLOSED_SETUP_DIALOG, {
      type: "open",
    });
    expect(state).toEqual({ step: "intro" });
    expect(setupStepLabel(state)).toBe("Step 1 of 3");

    state = setupDialogReducer(state, { type: "start" });
    expect(state).toEqual({ step: "scan" });
    expect(setupStepLabel(state)).toBe("Step 2 of 3");

    state = setupDialogReducer(state, {
      codes: TEST_CODES,
      source: "enrollment",
      type: "codes",
    });
    expect(state).toEqual({
      codes: TEST_CODES,
      saved: false,
      source: "enrollment",
      step: "codes",
    });
    expect(setupStepLabel(state)).toBe("Step 3 of 3 · shown once");
  });

  it("goes back from scanning to the explanation", () => {
    expect(setupDialogReducer({ step: "scan" }, { type: "back" })).toEqual({
      step: "intro",
    });
  });

  it("gates Finish on confirming the recovery codes were saved", () => {
    const codes: SetupDialogState = {
      codes: TEST_CODES,
      saved: false,
      source: "enrollment",
      step: "codes",
    };
    expect(canFinishSetup(codes)).toBe(false);
    expect(setupDialogReducer(codes, { type: "finish" })).toBe(codes);

    const saved = setupDialogReducer(codes, {
      saved: true,
      type: "confirm-saved",
    });
    expect(canFinishSetup(saved)).toBe(true);
    expect(setupDialogReducer(saved, { type: "finish" })).toEqual(
      CLOSED_SETUP_DIALOG,
    );

    const unticked = setupDialogReducer(saved, {
      saved: false,
      type: "confirm-saved",
    });
    expect(canFinishSetup(unticked)).toBe(false);
  });

  it("cannot be dismissed while one-time codes are shown, and drops them when closed", () => {
    const codes: SetupDialogState = {
      codes: TEST_CODES,
      saved: true,
      source: "regeneration",
      step: "codes",
    };
    expect(isSetupDismissible(codes)).toBe(false);
    expect(setupDialogReducer(codes, { type: "dismiss" })).toBe(codes);
    expect(setupStepLabel(codes)).toBe("Shown once");

    const closed = setupDialogReducer(codes, { type: "finish" });
    expect(closed).toEqual({ step: "closed" });
    expect(JSON.stringify(closed)).not.toContain(TEST_CODES[0]);
  });

  it("closes and reopens cleanly before codes are shown", () => {
    const dismissed = setupDialogReducer({ step: "scan" }, { type: "dismiss" });
    expect(dismissed).toEqual(CLOSED_SETUP_DIALOG);
    expect(setupDialogReducer(dismissed, { type: "open" })).toEqual({
      step: "intro",
    });
  });
});

describe("two-factor validation", () => {
  it("requires exactly six digits for an authenticator code", () => {
    expect(enrollmentSchema.safeParse({ code: "123456" }).success).toBe(true);
    for (const code of ["12345", "1234567", "12a456", ""]) {
      expect(enrollmentSchema.safeParse({ code }).success).toBe(false);
    }
  });

  it("keeps the discriminated proof: 6-digit authenticator or 10-char recovery code", () => {
    expect(
      proofSchema.safeParse({
        code: "123456",
        verificationMethod: "authenticator",
      }).success,
    ).toBe(true);
    expect(
      proofSchema.safeParse({
        code: "AB12CD34EF",
        verificationMethod: "recovery_code",
      }).success,
    ).toBe(true);
    for (const proof of [
      { code: "AB12CD34EF", verificationMethod: "authenticator" },
      { code: "ab12cd34ef", verificationMethod: "recovery_code" },
      { code: "AB12-CD34E", verificationMethod: "recovery_code" },
      { code: "", verificationMethod: "recovery_code" },
      { code: "123456", verificationMethod: "confirm" },
    ]) {
      expect(proofSchema.safeParse(proof).success).toBe(false);
    }
  });
});

describe("two-factor mutations", () => {
  it("returns the recovery codes only after the backend verifies enrollment", async () => {
    const verify = vi.fn().mockResolvedValue({ recoveryCodes: TEST_CODES });

    await expect(verifyEnrollment({ code: "123456" }, verify)).resolves.toEqual(
      { codes: TEST_CODES, status: "verified" },
    );
    expect(verify).toHaveBeenCalledWith({ code: "123456" });
  });

  it("maps a rejected enrollment code to safe copy", async () => {
    await expect(
      verifyEnrollment({ code: "123456" }, () => Promise.reject(apiError(401))),
    ).resolves.toEqual({
      message: "The authenticator code is incorrect.",
      status: "failed",
    });
    await expect(
      verifyEnrollment({ code: "123456" }, () => Promise.reject(apiError(429))),
    ).resolves.toMatchObject({
      message: "Too many attempts. Try again later.",
    });
  });

  it("sends the disable proof unchanged and reports success after the backend", async () => {
    const disable = vi.fn().mockResolvedValue(undefined);
    const regenerate = vi.fn();
    const proof = {
      code: "AB12CD34EF",
      verificationMethod: "recovery_code" as const,
    };

    await expect(
      submitTwoFactorProof("disable", proof, { disable, regenerate }),
    ).resolves.toEqual({ status: "disabled" });
    expect(disable).toHaveBeenCalledWith(proof);
    expect(regenerate).not.toHaveBeenCalled();
  });

  it("returns regenerated codes only after the backend accepts the proof", async () => {
    const regenerate = vi.fn().mockResolvedValue({ recoveryCodes: TEST_CODES });
    const proof = {
      code: "123456",
      verificationMethod: "authenticator" as const,
    };

    await expect(
      submitTwoFactorProof("regenerate", proof, {
        disable: vi.fn(),
        regenerate,
      }),
    ).resolves.toEqual({ codes: TEST_CODES, status: "regenerated" });
    expect(regenerate).toHaveBeenCalledWith(proof);
  });

  it("keeps two-factor unchanged when the proof is rejected", async () => {
    await expect(
      submitTwoFactorProof(
        "disable",
        { code: "123456", verificationMethod: "authenticator" },
        { disable: () => Promise.reject(apiError(401)), regenerate: vi.fn() },
      ),
    ).resolves.toEqual({
      message: "The verification code is incorrect.",
      status: "failed",
    });
    await expect(
      submitTwoFactorProof(
        "regenerate",
        { code: "123456", verificationMethod: "authenticator" },
        { disable: vi.fn(), regenerate: () => Promise.reject(apiError(423)) },
      ),
    ).resolves.toMatchObject({
      message: "This account is temporarily locked.",
    });
  });
});

describe("two-factor presentation helpers", () => {
  it("groups the manual key for reading without changing its characters", () => {
    const key = "JBSWY3DPEHPK3PXP4F2A";
    const grouped = groupSetupKey(key);
    expect(grouped).toBe("JBSW Y3DP EHPK 3PXP 4F2A");
    expect(grouped.replaceAll(" ", "")).toBe(key);
  });

  it("writes recovery codes to the download exactly as returned", () => {
    const contents = recoveryCodesFileContents(TEST_CODES);
    for (const code of TEST_CODES) {
      expect(contents.split("\n")).toContain(code);
    }
  });

  it("explains status load failures", () => {
    expect(twoFactorStatusError(apiError(403))).toContain(
      "does not have permission",
    );
    expect(twoFactorStatusError(new Error("x"))).toBe(
      "Two-factor settings could not be loaded. Refresh and try again.",
    );
  });
});
