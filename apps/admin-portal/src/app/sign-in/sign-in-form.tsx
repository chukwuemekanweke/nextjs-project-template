"use client";

import {
  PasswordField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { AuthHeading } from "@template/dashboard-ui";
import { Alert, Chip } from "@template/ui-core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { signInFeedback, type SignInFeedback } from "@/lib/sign-in-feedback";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm({ destination }: Readonly<{ destination: string }>) {
  const router = useRouter();
  const [error, setError] = useState<SignInFeedback>();
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
        setError(signInFeedback(response.status));
        return;
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError(signInFeedback(0));
    }
  }

  return (
    <>
      <AuthHeading
        description="Restricted to staff accounts with an assigned administrator role."
        eyebrow={<Chip>Admin portal</Chip>}
        title="Administrator sign in"
      />
      <ValidatedForm
        className="flex flex-col gap-4"
        form={form}
        onSubmit={submit}
      >
        {error ? (
          <Alert title={error.title} variant={error.variant}>
            {error.message}
          </Alert>
        ) : null}
        <TextField<SignInValues>
          autoComplete="email"
          autoFocus
          inputMode="email"
          label="Work email"
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
        <SubmitButton fullWidth>
          {form.formState.isSubmitting ? "Verifying access…" : "Continue"}
        </SubmitButton>
      </ValidatedForm>
    </>
  );
}
