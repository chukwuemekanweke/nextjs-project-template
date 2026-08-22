"use client";

import {
  PasswordField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { safeSignInError } from "@/lib/sign-in";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm({
  destination,
  initialEmail,
}: Readonly<{ destination: string; initialEmail: string }>) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const form = useValidatedForm(signInSchema, {
    defaultValues: { email: initialEmail, password: "" },
  });

  async function submit(values: SignInValues) {
    setError(undefined);

    try {
      const response = await fetch("/api/auth/session", {
        body: JSON.stringify(values),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        setError(safeSignInError(response.status));
        return;
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError(safeSignInError(0));
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
      <TextField<SignInValues>
        autoComplete="email"
        autoFocus={!initialEmail}
        inputMode="email"
        label="Email address"
        name="email"
        placeholder="you@example.com"
        required
      />
      <PasswordField<SignInValues>
        autoComplete="current-password"
        autoFocus={Boolean(initialEmail)}
        label="Password"
        name="password"
        required
      />
      <SubmitButton
        className="bg-brand-500 hover:bg-brand-600 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        pending={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </SubmitButton>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Need an account?{" "}
        <Link
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
          href="/register"
        >
          Register
        </Link>
      </p>
    </ValidatedForm>
  );
}
