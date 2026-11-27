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
import { Alert, IconTile, MailIcon } from "@template/ui-core";
import { useRef, useState } from "react";
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

type Feedback = AuthFeedback & Readonly<{ offerNewCode?: boolean }>;

const EMPTY_VALUES: PasswordResetCompletionValues = {
  confirmPassword: "",
  otp: "",
  password: "",
};

/**
 * Code + new password (design `AuthForgotSent`, `AuthResetPassword`,
 * `AuthResetExpired`). The code and both passwords are submitted together;
 * there is no separate verify step and no auto-submit on the sixth digit.
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
  const [feedback, setFeedback] = useState<Feedback>();
  const submitting = useRef(false);
  const form = useValidatedForm(passwordResetCompletionSchema, {
    defaultValues: EMPTY_VALUES,
  });
  const busy = form.formState.isSubmitting;

  async function submit(values: PasswordResetCompletionValues) {
    if (submitting.current) return;
    submitting.current = true;
    setFeedback(undefined);
    try {
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
      setFeedback({
        ...passwordResetFeedback(failure, "complete"),
        offerNewCode: failure === "invalid_code",
      });
    } finally {
      submitting.current = false;
    }
  }

  async function resendCode() {
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
        {feedback ? (
          <Alert
            action={
              feedback.offerNewCode ? (
                <button
                  className={authLinkClassName}
                  disabled={resendPending}
                  onClick={resendCode}
                  type="button"
                >
                  Send a new code
                </button>
              ) : undefined
            }
            title={feedback.title}
            variant={feedback.variant}
          >
            {feedback.message}
          </Alert>
        ) : null}
        <ConfirmationCodeField<PasswordResetCompletionValues>
          autoFocus
          disabled={busy}
          label="Reset code"
          length={PASSWORD_RESET_CODE_LENGTH}
          name="otp"
          required
        />
        <PasswordField<PasswordResetCompletionValues>
          autoComplete="new-password"
          disabled={busy}
          hint={PASSWORD_POLICY_HINT}
          label="New password"
          name="password"
          required
        />
        <PasswordField<PasswordResetCompletionValues>
          autoComplete="new-password"
          disabled={busy}
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
          className={authLinkClassName}
          disabled={resendPending || busy}
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
