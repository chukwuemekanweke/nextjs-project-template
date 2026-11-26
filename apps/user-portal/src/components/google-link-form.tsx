"use client";

import {
  PasswordField,
  SubmitButton,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { AuthHeading } from "@template/dashboard-ui";
import { ArrowLeftIcon, IconTile, KeyIcon } from "@template/ui-core";
import { useState } from "react";
import { z } from "zod";
import { googleFeedback, type AuthFeedback } from "@/lib/auth-feedback";
import { googleErrorFromResponse } from "@/lib/google-authentication";
import { AuthFeedbackAlert } from "./auth-feedback-alert";
import { authLinkClassName } from "./auth-link";

const linkSchema = z.object({
  password: z.string().min(1, "Enter your existing password."),
});

type LinkValues = z.infer<typeof linkSchema>;

export function GoogleLinkForm({
  onRestart,
  onSuccess,
}: Readonly<{ onRestart: () => void; onSuccess: () => void }>) {
  const [error, setError] = useState<AuthFeedback>();
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
        setError(googleFeedback(await googleErrorFromResponse(response)));
        return;
      }
      onSuccess();
    } catch {
      setError(
        googleFeedback({
          message:
            "Account linking is temporarily unavailable. Try again later.",
          restartRequired: false,
        }),
      );
    }
  }

  return (
    <>
      <AuthHeading
        description="An account already exists for this Google email. Enter its password once to link Google sign-in to it."
        icon={
          <IconTile className="size-14 rounded-[14px]" size="lg">
            <KeyIcon />
          </IconTile>
        }
        title="Link your Google account"
      />
      <ValidatedForm
        className="flex flex-col gap-4"
        form={form}
        onSubmit={submit}
      >
        <AuthFeedbackAlert feedback={error} />
        <PasswordField<LinkValues>
          autoComplete="current-password"
          autoFocus
          label="Password"
          name="password"
          required
        />
        <SubmitButton fullWidth>
          {form.formState.isSubmitting ? "Linking…" : "Link and sign in"}
        </SubmitButton>
      </ValidatedForm>
      <button
        className={`${authLinkClassName} text-small inline-flex items-center gap-1.5 self-start`}
        onClick={onRestart}
        type="button"
      >
        <ArrowLeftIcon size="xs" />
        Use a different account
      </button>
    </>
  );
}
