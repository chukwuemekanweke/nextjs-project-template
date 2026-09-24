"use client";

import {
  PasswordField,
  SubmitButton,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { useState } from "react";
import { z } from "zod";
import {
  type GoogleAuthenticationError,
  googleErrorFromResponse,
} from "@/lib/google-authentication";

const linkSchema = z.object({
  password: z.string().min(1, "Enter your existing password."),
});

type LinkValues = z.infer<typeof linkSchema>;

export function GoogleLinkForm({
  onRestart,
  onSuccess,
}: Readonly<{ onRestart: () => void; onSuccess: () => void }>) {
  const [error, setError] = useState<GoogleAuthenticationError>();
  const form = useValidatedForm(linkSchema, {
    defaultValues: { password: "" },
  });

  async function submit(values: LinkValues) {
    setError(undefined);
    try {
      const response = await fetch("/api/auth/google/link", {
        body: JSON.stringify(values),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        setError(await googleErrorFromResponse(response));
        return;
      }
      onSuccess();
    } catch {
      setError({
        message: "Account linking is temporarily unavailable. Try again later.",
        restartRequired: false,
      });
    }
  }

  return (
    <ValidatedForm className="space-y-5" form={form} onSubmit={submit}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Connect your Google account
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          An account already exists for this Google email. Enter your existing
          password to connect Google.
        </p>
      </div>
      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error.message}
        </div>
      ) : null}
      <PasswordField<LinkValues>
        autoComplete="current-password"
        autoFocus
        label="Existing password"
        name="password"
        required
      />
      <SubmitButton
        className="bg-brand-500 hover:bg-brand-600 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        pending={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Connecting…" : "Connect and sign in"}
      </SubmitButton>
      {error?.restartRequired ? (
        <button
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 w-full text-sm font-medium"
          onClick={onRestart}
          type="button"
        >
          Restart Continue with Google
        </button>
      ) : null}
    </ValidatedForm>
  );
}
