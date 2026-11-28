"use client";

import {
  useCompletePasswordReset,
  useRequestPasswordReset,
} from "@template/api-react/authentication";
import {
  applyBackendValidation,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { AuthHeading } from "@template/dashboard-ui";
import {
  ArrowLeftIcon,
  buttonVariants,
  CircleCheckIcon,
  IconTile,
  KeyIcon,
} from "@template/ui-core";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthFeedbackAlert } from "@/components/auth-feedback-alert";
import { authLinkClassName } from "@/components/auth-link";
import { passwordResetFeedback, type AuthFeedback } from "@/lib/auth-feedback";
import {
  classifyPasswordResetFailure,
  createAttemptGuard,
  createPasswordResetCompletion,
  type GuardedResult,
  type PasswordResetCompletionValues,
  type PasswordResetStep,
} from "@/lib/password-reset";
import { emailSchema, normalizeRegistrationEmail } from "@/lib/registration";
import { createSignInHref } from "@/lib/sign-in";
import { PasswordResetCompletionForm } from "./password-reset-completion-form";

type EmailValues = { email: string };

const headingIcon = (icon: ReactNode, tone?: "success") => (
  <IconTile className="size-14 rounded-[14px]" size="lg" tone={tone}>
    {icon}
  </IconTile>
);

/**
 * Email → code and new password → done. The steps are local state on one
 * public route: reloading starts again at the email step, and nothing
 * sensitive is stored or placed in the URL.
 */
export function ForgotPasswordFlow({
  signInDestination,
}: Readonly<{ signInDestination: string }>) {
  const requestReset = useRequestPasswordReset();
  const completeReset = useCompletePasswordReset();
  const [attempts] = useState(createAttemptGuard);
  const [step, setStep] = useState<PasswordResetStep>({
    email: "",
    kind: "request",
  });
  const signInHref = createSignInHref({ returnTo: signInDestination });

  function requestCode(email: string): Promise<GuardedResult<unknown>> {
    return attempts.run(() => requestReset.mutateAsync({ email }));
  }

  async function complete(
    email: string,
    values: PasswordResetCompletionValues,
  ) {
    const result = await attempts.run(() =>
      completeReset.mutateAsync(createPasswordResetCompletion(email, values)),
    );
    // Drop the code and passwords held as mutation variables once the
    // attempt settles, success or failure. A stale attempt leaves state
    // alone: "Change email" already reset it and a newer one may own it.
    if (result.status !== "stale") completeReset.reset();
    return result;
  }

  function changeEmail() {
    if (step.kind !== "reset") return;
    // Late replies for the previous address are ignored from here on.
    attempts.advance();
    requestReset.reset();
    completeReset.reset();
    setStep({ email: step.email, kind: "request" });
  }

  if (step.kind === "request") {
    return (
      <PasswordResetRequestForm
        defaultEmail={step.email}
        onAccepted={(email) => {
          requestReset.reset();
          setStep({ email, kind: "reset" });
        }}
        pending={requestReset.isPending}
        requestCode={requestCode}
        signInHref={signInHref}
      />
    );
  }

  if (step.kind === "reset") {
    const email = step.email;
    return (
      <PasswordResetCompletionForm
        complete={(values) => complete(email, values)}
        email={email}
        onChangeEmail={changeEmail}
        onCompleted={() => {
          requestReset.reset();
          setStep({ email, kind: "done" });
        }}
        resend={() => requestCode(email)}
        resendPending={requestReset.isPending}
      />
    );
  }

  return (
    <PasswordResetDone
      signInHref={createSignInHref({
        email: step.email,
        returnTo: signInDestination,
      })}
    />
  );
}

/**
 * Success replaces the form the user was in, so focus moves to this region
 * (announcing the heading) instead of falling back to the document body.
 */
function PasswordResetDone({ signInHref }: Readonly<{ signInHref: string }>) {
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => {
    region.current?.focus();
  }, []);

  return (
    <div
      className="flex flex-col gap-5 outline-none md:gap-6"
      ref={region}
      tabIndex={-1}
    >
      <AuthHeading
        description="You can now sign in with your new password. For your security, all your existing sessions were signed out."
        icon={headingIcon(<CircleCheckIcon />, "success")}
        title="Password updated"
      />
      <Link className={buttonVariants({ fullWidth: true })} href={signInHref}>
        Sign in
      </Link>
    </div>
  );
}

function PasswordResetRequestForm({
  defaultEmail,
  onAccepted,
  pending,
  requestCode,
  signInHref,
}: Readonly<{
  defaultEmail: string;
  onAccepted: (email: string) => void;
  pending: boolean;
  requestCode: (email: string) => Promise<GuardedResult<unknown>>;
  signInHref: string;
}>) {
  const [feedback, setFeedback] = useState<AuthFeedback>();
  const form = useValidatedForm(emailSchema, {
    defaultValues: { email: defaultEmail },
  });

  async function submit(values: EmailValues) {
    setFeedback(undefined);
    const email = normalizeRegistrationEmail(values.email);
    const result = await requestCode(email);
    if (result.status === "stale") return;
    if (result.status === "fulfilled") {
      onAccepted(email);
      return;
    }
    const failure = classifyPasswordResetFailure(result.error, "request");
    if (failure === "validation") {
      const general = applyBackendValidation(result.error, form.setError, [
        "email",
      ]);
      setFeedback(
        general[0]
          ? { message: general[0], title: "Check your email", variant: "error" }
          : undefined,
      );
      return;
    }
    setFeedback(passwordResetFeedback(failure, "request"));
  }

  return (
    <>
      <AuthHeading
        description="Enter the email on your account. If it matches an account, we'll send a 6-digit code to reset your password."
        icon={headingIcon(<KeyIcon />)}
        title="Reset your password"
      />
      <ValidatedForm
        className="flex flex-col gap-4"
        form={form}
        onSubmit={submit}
      >
        <AuthFeedbackAlert feedback={feedback} />
        <TextField<EmailValues>
          autoComplete="email"
          autoFocus
          inputMode="email"
          label="Email address"
          name="email"
          placeholder="you@example.com"
          required
        />
        <SubmitButton fullWidth pending={pending}>
          {pending || form.formState.isSubmitting
            ? "Sending code…"
            : "Send code"}
        </SubmitButton>
      </ValidatedForm>
      <Link
        className={`${authLinkClassName} text-small inline-flex items-center gap-1.5 self-start`}
        href={signInHref}
      >
        <ArrowLeftIcon size="xs" />
        Back to sign in
      </Link>
    </>
  );
}
