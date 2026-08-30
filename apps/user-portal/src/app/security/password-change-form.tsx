"use client";

import { useChangePassword } from "@template/api-react/authentication";
import {
  applyBackendValidation,
  PasswordField,
  SubmitButton,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { Alert } from "@template/ui-core";
import { useCallback, useRef, useState } from "react";
import type { z } from "zod";
import { passwordChangeSchema } from "@/lib/password-change";

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

const passwordFields = [
  "currentPassword",
  "newPassword",
  "confirmNewPassword",
] as const;

export function PasswordChangeForm() {
  const changePassword = useChangePassword();
  const submissionActive = useRef(false);
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();
  const form = useValidatedForm(passwordChangeSchema, {
    defaultValues: {
      confirmNewPassword: "",
      currentPassword: "",
      newPassword: "",
    },
  });
  const dismissError = useCallback(() => setError(undefined), []);
  const dismissConfirmation = useCallback(() => setConfirmation(undefined), []);

  async function submitPasswordChange(values: PasswordChangeValues) {
    if (submissionActive.current) {
      return;
    }

    submissionActive.current = true;
    setError(undefined);
    setConfirmation(undefined);

    try {
      await changePassword.mutateAsync(values);
      form.reset();
      setConfirmation("Your password was changed successfully.");
    } catch (caughtError) {
      const generalErrors = applyBackendValidation(
        caughtError,
        form.setError,
        passwordFields,
        {
          confirmPassword: "confirmNewPassword",
          password: "newPassword",
        },
      );
      setError(generalErrors[0]);
    } finally {
      submissionActive.current = false;
    }
  }

  return (
    <ValidatedForm
      className="mt-5 space-y-5"
      form={form}
      onSubmit={submitPasswordChange}
    >
      {error ? (
        <Alert onDismiss={dismissError} variant="error">
          {error}
        </Alert>
      ) : null}
      {confirmation ? (
        <Alert
          autoDismissAfter={5_000}
          onDismiss={dismissConfirmation}
          variant="success"
        >
          {confirmation}
        </Alert>
      ) : null}
      <PasswordField<PasswordChangeValues>
        autoComplete="current-password"
        label="Current password"
        name="currentPassword"
        required
      />
      <PasswordField<PasswordChangeValues>
        autoComplete="new-password"
        label="New password"
        name="newPassword"
        required
      />
      <PasswordField<PasswordChangeValues>
        autoComplete="new-password"
        label="Confirm new password"
        name="confirmNewPassword"
        required
      />
      <div className="flex justify-end">
        <SubmitButton
          className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          pending={changePassword.isPending}
        >
          {changePassword.isPending ? "Changing…" : "Change password"}
        </SubmitButton>
      </div>
    </ValidatedForm>
  );
}
