import { applyBackendValidation } from "@template/forms";
import type { z } from "zod";
import type { passwordChangeSchema } from "@/lib/password-change";

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

type SetPasswordFieldError = Parameters<
  typeof applyBackendValidation<PasswordChangeValues>
>[1];

export type PasswordChangeOutcome =
  { status: "changed" } | { message: string | undefined; status: "failed" };

const PASSWORD_FIELDS = [
  "currentPassword",
  "newPassword",
  "confirmNewPassword",
] as const;

/** Backend field names that differ from the form's. */
const BACKEND_FIELD_ALIASES = {
  confirmPassword: "confirmNewPassword",
  password: "newPassword",
} as const;

/**
 * Sends the change through the existing mutation. Backend validation errors
 * land on their fields; anything unmapped is returned as a form-level
 * message. Success is reported only after the backend accepts the change.
 */
export async function submitPasswordChange(
  values: PasswordChangeValues,
  {
    changePassword,
    setError,
  }: Readonly<{
    changePassword: (values: PasswordChangeValues) => Promise<unknown>;
    setError: SetPasswordFieldError;
  }>,
): Promise<PasswordChangeOutcome> {
  try {
    await changePassword(values);
    return { status: "changed" };
  } catch (error) {
    const generalErrors = applyBackendValidation(
      error,
      setError,
      PASSWORD_FIELDS,
      BACKEND_FIELD_ALIASES,
    );
    return { message: generalErrors[0], status: "failed" };
  }
}
