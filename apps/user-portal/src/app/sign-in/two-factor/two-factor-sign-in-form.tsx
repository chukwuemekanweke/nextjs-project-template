"use client";

import {
  ConfirmationCodeField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { Alert } from "@template/ui-core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
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
  const [error, setError] = useState<string>();
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
        setError(failure.message);
        setExpired(failure.restartRequired);
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Verification is temporarily unavailable. Try again.");
    }
  }

  function submitCompletedCode() {
    void form.handleSubmit(submit)();
  }

  if (expired) {
    return (
      <div className="space-y-5">
        <Alert variant="warning">
          This verification request expired or is no longer valid. Restart
          sign-in to continue.
        </Alert>
        <button
          className="bg-brand-500 hover:bg-brand-600 w-full rounded-lg px-4 py-3 text-sm font-medium text-white"
          onClick={() => void restart()}
          type="button"
        >
          Restart sign-in
        </button>
      </div>
    );
  }

  return (
    <ValidatedForm className="space-y-5" form={form} onSubmit={submit}>
      {error ? <Alert variant="error">{error}</Alert> : null}
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
      {form.formState.isSubmitting ? (
        <div
          aria-live="polite"
          className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
          role="status"
        >
          <span
            aria-hidden="true"
            className="border-brand-500 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
          />
          Verifying…
        </div>
      ) : null}
      <div className="flex flex-col gap-3 text-center text-sm">
        <button
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
          onClick={() => {
            form.setValue(
              "verificationMethod",
              method === "authenticator" ? "recovery_code" : "authenticator",
            );
            form.setValue("code", "");
            form.clearErrors();
            setError(undefined);
          }}
          type="button"
        >
          {method === "authenticator"
            ? "Use a recovery code"
            : "Use an authenticator code"}
        </button>
        <button
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => void restart()}
          type="button"
        >
          Cancel
        </button>
      </div>
    </ValidatedForm>
  );
}
