"use client";

import { useConfirmEmail } from "@template/api-react/authentication";
import {
  applyBackendValidation,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import {
  confirmationSchema,
  emailSchema,
  normalizeRegistrationEmail,
} from "@/lib/registration";

const confirmEmailSchema = emailSchema.extend(confirmationSchema.shape);
type ConfirmEmailValues = z.infer<typeof confirmEmailSchema>;

export function ConfirmEmailForm({
  initialEmail,
}: Readonly<{ initialEmail: string }>) {
  const router = useRouter();
  const confirmEmail = useConfirmEmail();
  const [error, setError] = useState<string>();
  const form = useValidatedForm(confirmEmailSchema, {
    defaultValues: { email: initialEmail, otp: "" },
  });

  async function submit(values: ConfirmEmailValues) {
    setError(undefined);
    const email = normalizeRegistrationEmail(values.email);
    try {
      await confirmEmail.mutateAsync({ email, otp: values.otp.trim() });
      router.replace(
        `/sign-in?email=${encodeURIComponent(email)}&confirmed=true`,
      );
    } catch (caughtError) {
      const generalErrors = applyBackendValidation(caughtError, form.setError, [
        "email",
        "otp",
      ]);
      setError(generalErrors[0]);
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
      <TextField<ConfirmEmailValues>
        autoComplete="one-time-code"
        autoFocus={Boolean(initialEmail)}
        inputMode="numeric"
        label="Confirmation code"
        maxLength={6}
        name="otp"
        placeholder="123456"
        required
      />
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
              ? `/sign-in?email=${encodeURIComponent(initialEmail)}`
              : "/sign-in"
          }
        >
          Return to sign in
        </Link>
      </p>
    </ValidatedForm>
  );
}
