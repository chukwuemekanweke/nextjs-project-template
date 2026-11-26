"use client";

import { useRequestEmailConfirmationCode } from "@template/api-react/authentication";
import {
  applyBackendValidation,
  ConfirmationCodeField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { AuthHeading } from "@template/dashboard-ui";
import { Alert, ClockIcon, IconTile, MailIcon } from "@template/ui-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { RegistrationSteps } from "@/components/registration-steps";
import { authLinkClassName } from "@/components/auth-link";
import {
  confirmationSchema,
  emailSchema,
  normalizeRegistrationEmail,
  retrySecondsRemaining,
} from "@/lib/registration";
import { confirmEmailSession } from "@/lib/email-confirmation-session";
import { createPasskeySetupDestination } from "@/lib/passkey-setup";
import { createRegistrationHref, createSignInHref } from "@/lib/sign-in";

const confirmEmailSchema = emailSchema.extend(confirmationSchema.shape);
type ConfirmEmailValues = z.infer<typeof confirmEmailSchema>;

export function ConfirmEmailForm({
  emailNotConfirmed = false,
  initialEmail,
  initialNowUtc,
  initialRetryAtUtc,
  signInDestination,
}: Readonly<{
  /** Arrived from sign-in with an unconfirmed address (not registration). */
  emailNotConfirmed?: boolean;
  initialEmail: string;
  initialNowUtc: string;
  initialRetryAtUtc: string;
  signInDestination: string;
}>) {
  const router = useRouter();
  const requestConfirmationCode = useRequestEmailConfirmationCode();
  const [error, setError] = useState<string>();
  const [retryAtUtc, setRetryAtUtc] = useState(initialRetryAtUtc);
  const [nowMilliseconds, setNowMilliseconds] = useState(
    Date.parse(initialNowUtc),
  );
  const form = useValidatedForm(confirmEmailSchema, {
    defaultValues: { email: initialEmail, otp: "" },
  });
  const remainingSeconds = retrySecondsRemaining(retryAtUtc, nowMilliseconds);

  useEffect(() => {
    if (remainingSeconds === 0) {
      return;
    }
    const interval = window.setInterval(() => {
      setNowMilliseconds(Date.now());
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [remainingSeconds]);

  async function submit(values: ConfirmEmailValues) {
    setError(undefined);
    const email = normalizeRegistrationEmail(values.email);
    try {
      await confirmEmailSession({ email, otp: values.otp.trim() });
      router.replace(createPasskeySetupDestination(signInDestination));
      router.refresh();
    } catch (caughtError) {
      // A known address has no visible field, so its errors stay form-level.
      const generalErrors = applyBackendValidation(
        caughtError,
        form.setError,
        initialEmail ? ["otp"] : ["email", "otp"],
      );
      setError(generalErrors[0]);
    }
  }

  function submitCompletedCode() {
    void form.handleSubmit(submit)();
  }

  async function resendCode() {
    if (remainingSeconds > 0) {
      return;
    }
    const emailIsValid = await form.trigger("email");
    if (!emailIsValid) {
      return;
    }
    const email = normalizeRegistrationEmail(form.getValues("email"));
    try {
      const response = await requestConfirmationCode.mutateAsync({ email });
      setRetryAtUtc(response.retryAtUtc);
      setNowMilliseconds(Date.now());
    } catch {
      // Resend remains available so the customer can try again.
    }
  }

  return (
    <>
      {emailNotConfirmed ? null : <RegistrationSteps current="confirm" />}
      <AuthHeading
        description={
          initialEmail ? (
            <>
              We sent a confirmation code to{" "}
              <b className="text-fg font-semibold">{initialEmail}</b>. Enter it
              below to confirm your address.
            </>
          ) : (
            "Enter your email address and the confirmation code we sent to it."
          )
        }
        icon={
          <IconTile className="size-14 rounded-[14px]" size="lg">
            <MailIcon />
          </IconTile>
        }
        title="Check your email"
      />
      {emailNotConfirmed ? (
        <Alert title="Email not confirmed" variant="warning">
          Enter the code we sent to your email to finish setting up your
          account.
        </Alert>
      ) : null}
      <ValidatedForm
        className="flex flex-col gap-4"
        form={form}
        onSubmit={submit}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        {initialEmail ? null : (
          <TextField<ConfirmEmailValues>
            autoComplete="email"
            autoFocus
            inputMode="email"
            label="Email address"
            name="email"
            required
          />
        )}
        <ConfirmationCodeField<ConfirmEmailValues>
          autoFocus={Boolean(initialEmail)}
          label="Confirmation code"
          name="otp"
          onComplete={submitCompletedCode}
          required
        />
        <SubmitButton fullWidth>
          {form.formState.isSubmitting ? "Confirming…" : "Confirm email"}
        </SubmitButton>
      </ValidatedForm>
      <div className="text-small text-fg-muted flex items-center justify-center gap-2">
        {remainingSeconds > 0 ? (
          <p className="flex items-center gap-2">
            <ClockIcon size="xs" />
            Resend code in {formatCountdown(remainingSeconds)}
          </p>
        ) : (
          <button
            className={authLinkClassName}
            disabled={requestConfirmationCode.isPending}
            onClick={resendCode}
            type="button"
          >
            {requestConfirmationCode.isPending
              ? "Sending…"
              : "Resend confirmation code"}
          </button>
        )}
      </div>
      <p className="text-small text-fg-subtle text-center">
        {emailNotConfirmed ? (
          <Link
            className={authLinkClassName}
            href={createSignInHref({
              email: initialEmail,
              returnTo: signInDestination,
            })}
          >
            Back to sign in
          </Link>
        ) : (
          <>
            Wrong address?{" "}
            <Link
              className={authLinkClassName}
              href={createRegistrationHref(signInDestination)}
            >
              Start again
            </Link>
          </>
        )}
      </p>
    </>
  );
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
