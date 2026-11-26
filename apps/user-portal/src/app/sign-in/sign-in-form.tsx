"use client";

import { useRequestEmailConfirmationCode } from "@template/api-react/authentication";
import {
  PasswordField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { AuthHeading } from "@template/dashboard-ui";
import { Alert, Divider } from "@template/ui-core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";
import { z } from "zod";
import { AuthFeedbackAlert } from "@/components/auth-feedback-alert";
import { GoogleAuthenticationButton } from "@/components/google-authentication-button";
import { GoogleLinkForm } from "@/components/google-link-form";
import { authLinkClassName } from "@/components/auth-link";
import {
  googleFeedback,
  passkeyFeedback,
  signInFeedback,
  type AuthFeedback,
} from "@/lib/auth-feedback";
import type {
  GoogleAuthenticationError,
  GoogleAuthenticationOutcome,
} from "@/lib/google-authentication";
import type { PasskeySignInResult } from "@/lib/passkey-sign-in";
import {
  createEmailConfirmationDestination,
  createRegistrationHref,
  createTwoFactorDestination,
  EMAIL_NOT_CONFIRMED_REASON,
} from "@/lib/sign-in";
import { PasskeySignInButton } from "./passkey-sign-in-button";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm({
  destination,
  emailConfirmed = false,
  forgotPasswordHref,
  googleClientId,
  initialEmail,
}: Readonly<{
  destination: string;
  /** Shows the "email confirmed" notice (validated `confirmed=true`). */
  emailConfirmed?: boolean;
  /**
   * Password-recovery entry point on the password label row. Rendered only
   * when supplied: the recovery route ships with FE-UI-020.
   */
  forgotPasswordHref?: string;
  googleClientId: string;
  initialEmail: string;
}>) {
  const router = useRouter();
  const requestConfirmationCode = useRequestEmailConfirmationCode();
  const [error, setError] = useState<AuthFeedback>();
  const [googlePending, setGooglePending] = useState(false);
  const [passkeyPending, setPasskeyPending] = useState(false);
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
      setError(googleFeedback(failure));
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
      if (outcome.status === "two_factor_required") {
        router.replace(createTwoFactorDestination(destination));
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

  const handlePasskeyOutcome = useCallback(
    (result: PasskeySignInResult) => {
      if (result.status === "authenticated") {
        setError(undefined);
        completeAuthentication();
        return;
      }
      if (result.status === "two_factor_required") {
        setError(undefined);
        router.replace(createTwoFactorDestination(destination));
        return;
      }
      // WebAuthn cancellation is a normal outcome and stays silent.
      setError(
        result.status === "error" ? passkeyFeedback(result.message) : undefined,
      );
    },
    [completeAuthentication, destination, router],
  );
  const handlePasskeyPendingChange = useCallback((pending: boolean) => {
    setPasskeyPending(pending);
    if (pending) setError(undefined);
  }, []);
  const alternativePending = googlePending || passkeyPending;

  async function submit(values: SignInValues) {
    if (alternativePending) return;
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
              reason: EMAIL_NOT_CONFIRMED_REASON,
              retryAtUtc,
              returnTo: destination,
            }),
          );
          return;
        }
        setError(signInFeedback(response.status));
        return;
      }

      const result = (await response.json()) as {
        status: "authenticated" | "two_factor_required";
      };
      if (result.status === "two_factor_required") {
        router.replace(createTwoFactorDestination(destination));
        return;
      }
      completeAuthentication();
    } catch {
      setError(signInFeedback(0));
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
    <>
      <AuthHeading
        description="Sign in to your account to continue."
        title="Welcome back"
      />
      {emailConfirmed && !error ? (
        <Alert title="Email confirmed" variant="success">
          Enter your password to sign in.
        </Alert>
      ) : null}
      <AuthFeedbackAlert feedback={error} />
      <div className="flex flex-col gap-3">
        <GoogleAuthenticationButton
          clientId={googleClientId}
          disabled={form.formState.isSubmitting || passkeyPending}
          onError={handleGoogleError}
          onOutcome={handleGoogleOutcome}
          onPendingChange={setGooglePending}
        />
        <PasskeySignInButton
          disabled={form.formState.isSubmitting || googlePending}
          onOutcome={handlePasskeyOutcome}
          onPendingChange={handlePasskeyPendingChange}
        />
      </div>
      <Divider label="or with email" />
      <ValidatedForm
        className="flex flex-col gap-4"
        form={form}
        onSubmit={submit}
      >
        <TextField<SignInValues>
          autoComplete="email"
          autoFocus={!initialEmail}
          disabled={alternativePending}
          inputMode="email"
          label="Email address"
          name="email"
          placeholder="you@example.com"
          required
        />
        <PasswordField<SignInValues>
          autoComplete="current-password"
          autoFocus={Boolean(initialEmail)}
          disabled={alternativePending}
          label="Password"
          labelAction={
            forgotPasswordHref ? (
              <Link className={authLinkClassName} href={forgotPasswordHref}>
                Forgot password?
              </Link>
            ) : undefined
          }
          name="password"
          required
        />
        <SubmitButton
          disabled={alternativePending}
          fullWidth
          pending={form.formState.isSubmitting}
        >
          {googlePending
            ? "Google sign-in in progress…"
            : passkeyPending
              ? "Passkey sign-in in progress…"
              : form.formState.isSubmitting
                ? "Signing in…"
                : "Sign in"}
        </SubmitButton>
      </ValidatedForm>
      <p className="text-small text-fg-muted text-center">
        New here?{" "}
        <Link
          className={authLinkClassName}
          href={createRegistrationHref(destination)}
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
