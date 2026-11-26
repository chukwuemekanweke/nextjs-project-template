"use client";

import { AuthHeading } from "@template/dashboard-ui";
import {
  ConfirmationCodeField,
  SubmitButton,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import {
  Alert,
  ArrowLeftIcon,
  Button,
  IconTile,
  ShieldCheckIcon,
} from "@template/ui-core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthFeedbackAlert } from "@/components/auth-feedback-alert";
import { authLinkClassName } from "@/components/auth-link";
import { twoFactorFeedback, type AuthFeedback } from "@/lib/auth-feedback";
import { twoFactorErrorFromResponse } from "@/lib/two-factor";

const verificationSchema = z.discriminatedUnion("verificationMethod", [
  z.object({
    code: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
    verificationMethod: z.literal("authenticator"),
  }),
  z.object({
    code: z
      .string()
      .regex(/^[A-Z0-9]{10}$/, "Enter the complete recovery code."),
    verificationMethod: z.literal("recovery_code"),
  }),
]);

type VerificationValues = z.infer<typeof verificationSchema>;

export function TwoFactorSignInForm({
  destination,
}: Readonly<{ destination: string }>) {
  const router = useRouter();
  const [error, setError] = useState<AuthFeedback>();
  const [expired, setExpired] = useState(false);
  const form = useValidatedForm<VerificationValues>(verificationSchema, {
    defaultValues: { code: "", verificationMethod: "authenticator" },
  });
  const method = form.watch("verificationMethod");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    void fetch("/api/auth/session/two-factor", {
      credentials: "same-origin",
    }).then(async (response) => {
      if (!response.ok) {
        setExpired(true);
        return;
      }
      const state = (await response.json()) as { expiresAtUtc: string };
      const remaining = Date.parse(state.expiresAtUtc) - Date.now();
      if (remaining <= 0) {
        setExpired(true);
        return;
      }
      timer = setTimeout(
        () => setExpired(true),
        Math.min(remaining, 2_147_483_647),
      );
    });
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  async function restart() {
    await fetch("/api/auth/session/two-factor", {
      credentials: "same-origin",
      method: "DELETE",
    }).catch(() => undefined);
    router.replace(
      `/sign-in?${new URLSearchParams({ returnTo: destination })}`,
    );
  }

  async function submit(values: VerificationValues) {
    if (form.formState.isSubmitting) return;
    setError(undefined);
    try {
      const response = await fetch("/api/auth/session/two-factor", {
        body: JSON.stringify(values),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        const failure = await twoFactorErrorFromResponse(response);
        setError(
          twoFactorFeedback({
            message: failure.message,
            method: values.verificationMethod,
            status: response.status,
          }),
        );
        setExpired(failure.restartRequired);
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setError(
        twoFactorFeedback({
          message: "Verification is temporarily unavailable. Try again.",
          method: values.verificationMethod,
          status: 0,
        }),
      );
    }
  }

  function submitCompletedCode() {
    void form.handleSubmit(submit)();
  }

  function switchMethod() {
    form.setValue(
      "verificationMethod",
      method === "authenticator" ? "recovery_code" : "authenticator",
    );
    form.setValue("code", "");
    form.clearErrors();
    setError(undefined);
  }

  const heading = (
    <AuthHeading
      description={
        expired
          ? "Restart sign-in to request a new verification."
          : method === "authenticator"
            ? "Enter the 6-digit code from your authenticator app to finish signing in."
            : "Enter one of the recovery codes you saved when you turned on two-factor."
      }
      icon={
        <IconTile className="size-14 rounded-[14px]" size="lg">
          <ShieldCheckIcon />
        </IconTile>
      }
      title="Two-factor verification"
    />
  );

  if (expired) {
    return (
      <>
        {heading}
        <Alert title="Verification expired" variant="warning">
          {error?.message ??
            "This verification request expired or is no longer valid. Restart sign-in to continue."}
        </Alert>
        <Button fullWidth onClick={() => void restart()}>
          Restart sign-in
        </Button>
      </>
    );
  }

  return (
    <>
      {heading}
      <ValidatedForm
        className="flex flex-col gap-4"
        form={form}
        onSubmit={submit}
      >
        <AuthFeedbackAlert feedback={error} />
        <input {...form.register("verificationMethod")} type="hidden" />
        <ConfirmationCodeField<VerificationValues>
          autoFocus
          characterSet={method === "authenticator" ? "numeric" : "alphanumeric"}
          disabled={form.formState.isSubmitting}
          groupAfter={method === "recovery_code" ? 5 : undefined}
          label={
            method === "authenticator" ? "Authenticator code" : "Recovery code"
          }
          length={method === "authenticator" ? 6 : 10}
          name="code"
          onComplete={submitCompletedCode}
          required
        />
        <SubmitButton fullWidth>
          {form.formState.isSubmitting ? "Verifying…" : "Verify and sign in"}
        </SubmitButton>
      </ValidatedForm>
      <div className="border-border bg-surface-2 text-small flex flex-col items-start gap-2 rounded-lg border p-4">
        <p className="text-fg font-semibold">
          {method === "authenticator"
            ? "Lost access to your authenticator?"
            : "Have your authenticator app?"}
        </p>
        <p className="text-fg-muted">
          {method === "authenticator"
            ? "Use one of the recovery codes you saved when you turned on two-factor."
            : "Enter the current 6-digit code from the app instead."}
        </p>
        <button
          className={authLinkClassName}
          onClick={switchMethod}
          type="button"
        >
          {method === "authenticator"
            ? "Use a recovery code instead"
            : "Use an authenticator code instead"}
        </button>
      </div>
      <button
        className={`${authLinkClassName} text-small inline-flex items-center gap-1.5 self-start`}
        onClick={() => void restart()}
        type="button"
      >
        <ArrowLeftIcon size="xs" />
        Back to sign in
      </button>
    </>
  );
}
