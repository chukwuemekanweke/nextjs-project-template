"use client";

import { useRequestEmailConfirmationCode } from "@template/api-react/authentication";
import {
  PasswordField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";
import { z } from "zod";
import { GoogleAuthenticationButton } from "@/components/google-authentication-button";
import { GoogleLinkForm } from "@/components/google-link-form";
import type {
  GoogleAuthenticationError,
  GoogleAuthenticationOutcome,
} from "@/lib/google-authentication";
import {
  createEmailConfirmationDestination,
  safeSignInError,
} from "@/lib/sign-in";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm({
  destination,
  googleClientId,
  initialEmail,
}: Readonly<{
  destination: string;
  googleClientId: string;
  initialEmail: string;
}>) {
  const router = useRouter();
  const requestConfirmationCode = useRequestEmailConfirmationCode();
  const [error, setError] = useState<string>();
  const [googleStep, setGoogleStep] = useState<"entry" | "link">("entry");
  const form = useValidatedForm(signInSchema, {
    defaultValues: { email: initialEmail, password: "" },
    mode: "onSubmit",
  });

  const completeAuthentication = useCallback(() => {
    router.replace(destination);
    router.refresh();
  }, [destination, router]);

  const handleGoogleError = useCallback(
    (failure: GoogleAuthenticationError) => {
      setError(failure.message);
    },
    [],
  );

  const handleGoogleOutcome = useCallback(
    (outcome: GoogleAuthenticationOutcome) => {
      setError(undefined);
      if (outcome.status === "authenticated") {
        completeAuthentication();
        return;
      }
      if (outcome.status === "link_required") {
        setGoogleStep("link");
        return;
      }
      const parameters = new URLSearchParams({
        google: "continue",
        returnTo: destination,
      });
      router.replace(`/register?${parameters.toString()}`);
    },
    [completeAuthentication, destination, router],
  );

  async function submit(values: SignInValues) {
    setError(undefined);

    try {
      const response = await fetch("/api/auth/session", {
        body: JSON.stringify(values),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        if (response.status === 403) {
          const email = values.email.trim().toLowerCase();
          let retryAtUtc: string | undefined;
          try {
            const result = await requestConfirmationCode.mutateAsync({
              email,
            });
            retryAtUtc = result.retryAtUtc;
          } catch {
            // The confirmation page keeps resend available if this attempt fails.
          }
          router.replace(
            createEmailConfirmationDestination({
              email,
              retryAtUtc,
              returnTo: destination,
            }),
          );
          return;
        }
        setError(safeSignInError(response.status));
        return;
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError(safeSignInError(0));
    }
  }

  if (googleStep === "link") {
    return (
      <GoogleLinkForm
        onRestart={() => {
          setError(undefined);
          setGoogleStep("entry");
        }}
        onSuccess={completeAuthentication}
      />
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <GoogleAuthenticationButton
        clientId={googleClientId}
        onError={handleGoogleError}
        onOutcome={handleGoogleOutcome}
      />
      <AuthDivider />
      <ValidatedForm className="space-y-5" form={form} onSubmit={submit}>
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
      </ValidatedForm>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Need an account?{" "}
        <Link
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
          href="/register"
        >
          Register
        </Link>
      </p>
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
        or use email
      </span>
      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}
