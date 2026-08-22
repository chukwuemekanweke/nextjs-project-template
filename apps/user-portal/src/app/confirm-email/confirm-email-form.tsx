"use client";

import {
  useConfirmEmail,
  useRequestEmailConfirmationCode,
} from "@template/api-react/authentication";
import {
  applyBackendValidation,
  ConfirmationCodeField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  confirmationSchema,
  emailSchema,
  normalizeRegistrationEmail,
  retrySecondsRemaining,
} from "@/lib/registration";
import { DEFAULT_SIGN_IN_DESTINATION } from "@/lib/sign-in";

const confirmEmailSchema = emailSchema.extend(confirmationSchema.shape);
type ConfirmEmailValues = z.infer<typeof confirmEmailSchema>;

export function ConfirmEmailForm({
  initialEmail,
  initialNowUtc,
  initialRetryAtUtc,
  signInDestination,
}: Readonly<{
  initialEmail: string;
  initialNowUtc: string;
  initialRetryAtUtc: string;
  signInDestination: string;
}>) {
  const router = useRouter();
  const confirmEmail = useConfirmEmail();
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
      await confirmEmail.mutateAsync({ email, otp: values.otp.trim() });
      const parameters = new URLSearchParams({
        confirmed: "true",
        email,
      });
      if (signInDestination !== DEFAULT_SIGN_IN_DESTINATION) {
        parameters.set("returnTo", signInDestination);
      }
      router.replace(`/sign-in?${parameters.toString()}`);
    } catch (caughtError) {
      const generalErrors = applyBackendValidation(caughtError, form.setError, [
        "email",
        "otp",
      ]);
      setError(generalErrors[0]);
    }
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
    <ValidatedForm className="space-y-5" form={form} onSubmit={submit}>
      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <TextField<ConfirmEmailValues>
        autoComplete="email"
        autoFocus={!initialEmail}
        inputMode="email"
        label="Email address"
        name="email"
        readOnly={Boolean(initialEmail)}
        required
      />
      <ConfirmationCodeField<ConfirmEmailValues>
        autoFocus={Boolean(initialEmail)}
        label="Confirmation code"
        name="otp"
        required
      />
      <div className="flex justify-end">
        <button
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 text-sm font-medium disabled:cursor-not-allowed disabled:text-gray-400"
          disabled={remainingSeconds > 0 || requestConfirmationCode.isPending}
          onClick={resendCode}
          type="button"
        >
          {requestConfirmationCode.isPending
            ? "Sending…"
            : remainingSeconds > 0
              ? `Resend code in ${formatCountdown(remainingSeconds)}`
              : "Resend confirmation code"}
        </button>
      </div>
      <SubmitButton
        className="bg-brand-500 hover:bg-brand-600 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        pending={confirmEmail.isPending}
      >
        {confirmEmail.isPending ? "Confirming…" : "Confirm email"}
      </SubmitButton>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        <Link
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
          href={
            initialEmail
              ? `/sign-in?email=${encodeURIComponent(initialEmail)}&returnTo=${encodeURIComponent(signInDestination)}`
              : `/sign-in?returnTo=${encodeURIComponent(signInDestination)}`
          }
        >
          Return to sign in
        </Link>
      </p>
    </ValidatedForm>
  );
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
