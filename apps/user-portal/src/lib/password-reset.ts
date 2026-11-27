import { isApiError } from "@template/api-client";
import type { CompletePasswordResetRequest } from "@template/api-client/authentication";
import { z } from "zod";
import { emailSchema, normalizeRegistrationEmail } from "./registration";

/**
 * Forgotten-password recovery by emailed one-time code (Trello FE-UI-020).
 * One public route holds three app-local steps; nothing here is persisted,
 * and the code and passwords never leave short-lived form state.
 */
export type PasswordResetStep =
  | Readonly<{ email: string; kind: "request" }>
  | Readonly<{ email: string; kind: "reset" }>
  | Readonly<{ email: string; kind: "done" }>;

export const PASSWORD_RESET_CODE_LENGTH = 6;

/** Backend policy (`CompletePasswordResetValidator` + ASP.NET Identity). */
export const PASSWORD_POLICY_HINT =
  "At least 8 characters with upper- and lowercase letters, a number and a symbol.";

export const passwordResetEmailSchema = emailSchema;
export type PasswordResetEmailValues = z.infer<typeof passwordResetEmailSchema>;

export const passwordResetCompletionSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your new password."),
    // A string of exactly six digits: leading zeroes are significant.
    otp: z
      .string()
      .regex(
        new RegExp(`^\\d{${PASSWORD_RESET_CODE_LENGTH}}$`),
        "Enter the 6-digit code.",
      ),
    password: z
      .string()
      .min(1, "Enter a new password.")
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one digit.")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one non-alphanumeric character.",
      ),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type PasswordResetCompletionValues = z.infer<
  typeof passwordResetCompletionSchema
>;

export function normalizePasswordResetEmail(email: string): string {
  return normalizeRegistrationEmail(email);
}

/**
 * The exact completion contract. The email comes from the accepted request
 * step, never from editable form state; passwords are sent unmodified.
 */
export function createPasswordResetCompletion(
  email: string,
  values: PasswordResetCompletionValues,
): CompletePasswordResetRequest {
  return {
    confirmPassword: values.confirmPassword,
    email,
    otp: values.otp,
    password: values.password,
  };
}

/**
 * Outcome classes the UI can state truthfully. The backend returns one
 * problem (400, no field errors) for a wrong, expired, already used or
 * attempt-exhausted code, and the BFF folds unknown emails into it, so those
 * cases are deliberately not told apart.
 */
export type PasswordResetFailure =
  "invalid_code" | "rate_limited" | "unavailable" | "validation";

export function classifyPasswordResetFailure(
  error: unknown,
  operation: "complete" | "request",
): PasswordResetFailure {
  if (!isApiError(error)) {
    return "unavailable";
  }
  if (error.status === 429) {
    return "rate_limited";
  }
  const hasFieldErrors = Object.keys(error.validationErrors).length > 0;
  if (error.status === 400 && hasFieldErrors) {
    return "validation";
  }
  if (
    operation === "complete" &&
    (error.status === 400 || error.status === 404)
  ) {
    return "invalid_code";
  }
  return "unavailable";
}

export type GuardedResult<T> =
  | Readonly<{ status: "fulfilled"; value: T }>
  | Readonly<{ error: unknown; status: "rejected" }>
  | Readonly<{ status: "stale" }>;

/**
 * Drops responses that belong to an abandoned attempt. Advancing (on
 * "Change email" or restart) makes every in-flight operation resolve as
 * `stale`, so a late reply for one email cannot move the flow for another.
 */
export function createAttemptGuard() {
  let attempt = 0;
  return {
    advance() {
      attempt += 1;
    },
    async run<T>(operation: () => Promise<T>): Promise<GuardedResult<T>> {
      const startedAttempt = attempt;
      try {
        const value = await operation();
        return startedAttempt === attempt
          ? { status: "fulfilled", value }
          : { status: "stale" };
      } catch (error) {
        return startedAttempt === attempt
          ? { error, status: "rejected" }
          : { status: "stale" };
      }
    },
  };
}
