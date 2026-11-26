"use client";

import { useChangePassword } from "@template/api-react/authentication";
import {
  PasswordField,
  SubmitButton,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import {
  Alert,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@template/ui-core";
import { useCallback, useRef, useState } from "react";
import { passwordChangeSchema } from "@/lib/password-change";
import {
  submitPasswordChange,
  type PasswordChangeValues,
} from "./password-change-submission";

const EMPTY_VALUES: PasswordChangeValues = {
  confirmNewPassword: "",
  currentPassword: "",
  newPassword: "",
};

/**
 * Password tab (reference `UserSecurity-password`). The backend exposes no
 * last-changed date and the change request has no "sign out other sessions"
 * option, so neither is shown (DR-053). Forgotten-password recovery is a
 * separate flow (Trello FE-UI-020).
 */
export function PasswordChangeCard() {
  const changePassword = useChangePassword();
  const submissionActive = useRef(false);
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();
  const form = useValidatedForm(passwordChangeSchema, {
    defaultValues: EMPTY_VALUES,
  });
  const dismissError = useCallback(() => setError(undefined), []);
  const dismissConfirmation = useCallback(() => setConfirmation(undefined), []);

  async function submit(values: PasswordChangeValues) {
    if (submissionActive.current) return;
    submissionActive.current = true;
    setError(undefined);
    setConfirmation(undefined);
    try {
      const outcome = await submitPasswordChange(values, {
        changePassword: changePassword.mutateAsync,
        setError: form.setError,
      });
      if (outcome.status === "changed") {
        // Clear every password from the form once the backend accepts it.
        form.reset(EMPTY_VALUES);
        setConfirmation("Your password was changed successfully.");
      } else {
        setError(outcome.message);
      }
    } finally {
      submissionActive.current = false;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Change password</CardTitle>
          <p className="text-small text-fg-muted mt-0.5">
            Confirm your current password before choosing a new one.
          </p>
        </div>
      </CardHeader>
      <ValidatedForm aria-label="Change password" form={form} onSubmit={submit}>
        <CardContent className="flex max-w-[480px] flex-col gap-4">
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
            hint="At least 8 characters, with upper- and lowercase letters, a number and a symbol."
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
        </CardContent>
        <CardFooter>
          <SubmitButton pending={changePassword.isPending}>
            Update password
          </SubmitButton>
        </CardFooter>
      </ValidatedForm>
    </Card>
  );
}
