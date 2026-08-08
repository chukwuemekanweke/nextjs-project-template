"use client";

import {
  PasswordField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { safeSignInError } from "@/lib/sign-in";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm({ destination }: Readonly<{ destination: string }>) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const form = useValidatedForm(signInSchema, {
    defaultValues: { email: "", password: "" },
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
        autoFocus
        inputMode="email"
        label="Email address"
        name="email"
        placeholder="you@example.com"
        required
      />
      <PasswordField<SignInValues>
        autoComplete="current-password"
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
    </ValidatedForm>
  );
}
