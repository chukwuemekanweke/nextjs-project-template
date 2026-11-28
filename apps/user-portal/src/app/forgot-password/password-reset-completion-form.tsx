"use client";

import {
  applyBackendValidation,
  ConfirmationCodeField,
  PasswordField,
  SubmitButton,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { AuthHeading } from "@template/dashboard-ui";
import { IconTile, MailIcon } from "@template/ui-core";
import { useState } from "react";
import { AuthFeedbackAlert } from "@/components/auth-feedback-alert";
import { authLinkClassName } from "@/components/auth-link";
import {
  passwordResetFeedback,
  passwordResetResentFeedback,
  type AuthFeedback,
} from "@/lib/auth-feedback";
import {
  classifyPasswordResetFailure,
  PASSWORD_POLICY_HINT,
  PASSWORD_RESET_CODE_LENGTH,
  passwordResetCompletionSchema,
  type GuardedResult,
  type PasswordResetCompletionValues,
} from "@/lib/password-reset";

const EMPTY_VALUES: PasswordResetCompletionValues = {
  confirmPassword: "",
  otp: "",
  password: "",
};

/**
 * Code + new password (design `AuthForgotSent`, `AuthResetPassword`,
 * `AuthResetExpired`). The code and both passwords are submitted together;
 * there is no separate verify step and no auto-submit on the sixth digit.
 *
 * Fields stay enabled while submitting so focus is never dropped; the
 * loading submit button already blocks repeated and implicit submission.
 */
export function PasswordResetCompletionForm({
  complete,
  email,
  onChangeEmail,
  onCompleted,
  resend,
  resendPending,
}: Readonly<{
  complete: (
    values: PasswordResetCompletionValues,
  ) => Promise<GuardedResult<unknown>>;
  email: string;
  onChangeEmail: () => void;
  onCompleted: () => void;
  resend: () => Promise<GuardedResult<unknown>>;
  resendPending: boolean;
}>) {
  const [feedback, setFeedback] = useState<AuthFeedback>();
  const form = useValidatedForm(passwordResetCompletionSchema, {
    defaultValues: EMPTY_VALUES,
  });
  const busy = form.formState.isSubmitting;

  async function submit(values: PasswordResetCompletionValues) {
    setFeedback(undefined);
    const result = await complete(values);
    if (result.status === "stale") return;
    if (result.status === "fulfilled") {
      form.reset(EMPTY_VALUES);
      onCompleted();
      return;
    }
    const failure = classifyPasswordResetFailure(result.error, "complete");
    if (failure === "validation") {
      const general = applyBackendValidation(result.error, form.setError, [
        "otp",
        "password",
        "confirmPassword",
      ]);
      setFeedback(
        general[0]
          ? {
              message: general[0],
              title: "Check your details",
              variant: "error",
            }
          : undefined,
      );
      return;
    }
    if (failure === "invalid_code") {
      form.setError("otp", { message: "Invalid or expired code." });
    }
    setFeedback(passwordResetFeedback(failure, "complete"));
  }

  async function resendCode() {
    // `aria-disabled`, not `disabled`, keeps focus on the control while busy.
    if (resendPending || busy) return;
    setFeedback(undefined);
    const result = await resend();
    if (result.status === "stale") return;
    if (result.status === "fulfilled") {
      // Enter the newest code; passwords typed so far are kept.
      form.setValue("otp", "");
      form.clearErrors("otp");
      setFeedback(passwordResetResentFeedback);
      return;
    }
    const failure = classifyPasswordResetFailure(result.error, "request");
    setFeedback(
      passwordResetFeedback(
        failure === "validation" ? "unavailable" : failure,
        "resend",
      ),
    );
  }

  return (
    <>
      <AuthHeading
        description={
          <>
            If an account uses <b className="text-fg font-semibold">{email}</b>,
            we sent it a 6-digit code. Enter it with your new password.{" "}
            <button
              className={authLinkClassName}
              disabled={busy}
              onClick={onChangeEmail}
              type="button"
            >
              Change email
            </button>
          </>
        }
        icon={
          <IconTile className="size-14 rounded-[14px]" size="lg">
            <MailIcon />
          </IconTile>
        }
        title="Enter your reset code"
      />
      <ValidatedForm
        className="flex flex-col gap-4"
        form={form}
        onSubmit={submit}
      >
        <AuthFeedbackAlert feedback={feedback} />
        <ConfirmationCodeField<PasswordResetCompletionValues>
          autoFocus
          label="Reset code"
          length={PASSWORD_RESET_CODE_LENGTH}
          name="otp"
          required
        />
        <PasswordField<PasswordResetCompletionValues>
          autoComplete="new-password"
          hint={PASSWORD_POLICY_HINT}
          label="New password"
          name="password"
          required
        />
        <PasswordField<PasswordResetCompletionValues>
          autoComplete="new-password"
          label="Confirm new password"
          name="confirmPassword"
          required
        />
        <SubmitButton disabled={resendPending} fullWidth>
          {busy ? "Resetting password…" : "Reset password"}
        </SubmitButton>
      </ValidatedForm>
      <p className="text-small text-fg-muted text-center">
        Didn&apos;t get it?{" "}
        <button
          aria-disabled={resendPending || busy || undefined}
          className={`${authLinkClassName} aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
          onClick={resendCode}
          type="button"
        >
          {resendPending ? "Sending…" : "Resend code"}
        </button>
      </p>
      <p className="text-small text-fg-subtle text-center">
        Resetting your password signs you out on all your devices.
      </p>
    </>
  );
}
