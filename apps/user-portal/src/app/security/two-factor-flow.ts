import { isApiError } from "@template/api-client";
import type {
  RecoveryCodesResponse,
  TwoFactorProofRequest,
  VerifyTwoFactorEnrollmentRequest,
} from "@template/api-client/authentication";
import { z } from "zod";

/* ------------------------------------------------------------------------ */
/* Validation (unchanged contract: 6-digit TOTP, 10-char recovery code)      */
/* ------------------------------------------------------------------------ */

export const enrollmentSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
});

export const proofSchema = z.discriminatedUnion("verificationMethod", [
  z.object({
    code: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
    verificationMethod: z.literal("authenticator"),
  }),
  z.object({
    code: z
      .string()
      .regex(/^[A-Z0-9]{10}$/, "Enter the complete recovery code."),
    verificationMethod: z.literal("recovery_code"),
  }),
]);

export type EnrollmentValues = z.infer<typeof enrollmentSchema>;
export type ProofValues = z.infer<typeof proofSchema>;
export type ProofAction = "disable" | "regenerate";

/* ------------------------------------------------------------------------ */
/* Setup dialog steps                                                        */
/* ------------------------------------------------------------------------ */

export type RecoveryCodeSource = "enrollment" | "regeneration";

/**
 * The setup dialog's state. Recovery codes live only here (ephemeral React
 * state): never in a URL, storage, logs or the query cache.
 */
export type SetupDialogState =
  | { step: "closed" }
  | { step: "intro" }
  | { step: "scan" }
  | {
      codes: readonly string[];
      saved: boolean;
      source: RecoveryCodeSource;
      step: "codes";
    };

export type SetupDialogEvent =
  | { type: "open" }
  | { type: "start" }
  | { type: "back" }
  | { codes: readonly string[]; source: RecoveryCodeSource; type: "codes" }
  | { saved: boolean; type: "confirm-saved" }
  | { type: "finish" }
  | { type: "dismiss" };

export const CLOSED_SETUP_DIALOG: SetupDialogState = { step: "closed" };

export function setupDialogReducer(
  state: SetupDialogState,
  event: SetupDialogEvent,
): SetupDialogState {
  switch (event.type) {
    case "open":
      return { step: "intro" };
    case "start":
      return state.step === "intro" ? { step: "scan" } : state;
    case "back":
      return state.step === "scan" ? { step: "intro" } : state;
    case "codes":
      return {
        codes: event.codes,
        saved: false,
        source: event.source,
        step: "codes",
      };
    case "confirm-saved":
      return state.step === "codes" ? { ...state, saved: event.saved } : state;
    case "finish":
      return canFinishSetup(state) ? CLOSED_SETUP_DIALOG : state;
    case "dismiss":
      return isSetupDismissible(state) ? CLOSED_SETUP_DIALOG : state;
  }
}

/** Finish is gated on confirming the one-time codes were saved. */
export function canFinishSetup(state: SetupDialogState): boolean {
  return state.step === "codes" && state.saved;
}

/**
 * Once codes are on screen the dialog can only be left through Finish, so
 * they cannot be lost by Escape or the close button.
 */
export function isSetupDismissible(state: SetupDialogState): boolean {
  return state.step !== "codes";
}

/** "Step n of 3" for enrollment; regenerated codes are a single step. */
export function setupStepLabel(state: SetupDialogState): string | undefined {
  if (state.step === "intro") return "Step 1 of 3";
  if (state.step === "scan") return "Step 2 of 3";
  if (state.step === "codes" && state.source === "enrollment")
    return "Step 3 of 3 · shown once";
  if (state.step === "codes") return "Shown once";
  return undefined;
}

/** Readability only: groups the manual key in fours. Copy uses the raw key. */
export function groupSetupKey(sharedKey: string): string {
  return sharedKey.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");
}

/* ------------------------------------------------------------------------ */
/* Mutation outcomes                                                          */
/* ------------------------------------------------------------------------ */

export type Failure = { message: string; status: "failed" };

export async function verifyEnrollment(
  values: EnrollmentValues,
  verify: (
    request: VerifyTwoFactorEnrollmentRequest,
  ) => Promise<RecoveryCodesResponse>,
): Promise<{ codes: string[]; status: "verified" } | Failure> {
  try {
    const result = await verify(values);
    return { codes: result.recoveryCodes, status: "verified" };
  } catch (error) {
    return {
      message: twoFactorManagementError(
        error,
        "The authenticator code is incorrect.",
      ),
      status: "failed",
    };
  }
}

/**
 * Disable or regenerate with a proof (authenticator or recovery code). The
 * outcome is reported only after the backend accepts the proof.
 */
export async function submitTwoFactorProof(
  action: ProofAction,
  values: ProofValues,
  mutations: Readonly<{
    disable: (request: TwoFactorProofRequest) => Promise<unknown>;
    regenerate: (
      request: TwoFactorProofRequest,
    ) => Promise<RecoveryCodesResponse>;
  }>,
): Promise<
  { status: "disabled" } | { codes: string[]; status: "regenerated" } | Failure
> {
  try {
    if (action === "regenerate") {
      const result = await mutations.regenerate(values);
      return { codes: result.recoveryCodes, status: "regenerated" };
    }
    await mutations.disable(values);
    return { status: "disabled" };
  } catch (error) {
    return {
      message: twoFactorManagementError(
        error,
        "The verification code is incorrect.",
      ),
      status: "failed",
    };
  }
}

export function twoFactorManagementError(
  error: unknown,
  unauthorizedMessage?: string,
): string {
  if (isApiError(error)) {
    if (error.status === 401 && unauthorizedMessage) return unauthorizedMessage;
    if (error.status === 423) return "This account is temporarily locked.";
    if (error.status === 429) return "Too many attempts. Try again later.";
    if (error.safeMessage) return error.safeMessage;
  }
  return "Two-factor settings could not be updated. Try again.";
}

export function twoFactorStatusError(error: unknown): string {
  if (isApiError(error) && error.status === 403) {
    return "Your current session does not have permission to manage two-factor authentication. Sign out and sign in again. If the problem continues, contact support.";
  }
  return "Two-factor settings could not be loaded. Refresh and try again.";
}

/** Plain-text file contents for the presentation-only download. */
export function recoveryCodesFileContents(codes: readonly string[]): string {
  return [
    "Two-factor authentication recovery codes",
    "Each code can be used only once.",
    "",
    ...codes,
    "",
  ].join("\n");
}
