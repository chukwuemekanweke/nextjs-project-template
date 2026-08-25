"use client";

import { useUpdateProfile } from "@template/api-react/profiles";
import { Alert } from "@template/ui-core";
import {
  applyBackendValidation,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { z } from "zod";
import {
  normalizeProfileUpdate,
  profileUpdateFallbackMessages,
  profileUpdateSchema,
} from "@/lib/profile-editing";

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

export function ProfileEditForm({
  firstName,
  lastName,
}: Readonly<{ firstName: string; lastName: string }>) {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const submissionActive = useRef(false);
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();
  const form = useValidatedForm(profileUpdateSchema, {
    defaultValues: { firstName, lastName },
  });
  const dismissError = useCallback(() => setError(undefined), []);
  const dismissConfirmation = useCallback(() => setConfirmation(undefined), []);

  async function submitProfile(values: ProfileUpdateValues) {
    if (submissionActive.current) {
      return;
    }

    submissionActive.current = true;
    setError(undefined);
    setConfirmation(undefined);

    try {
      const normalizedValues = normalizeProfileUpdate(values);
      await updateProfile.mutateAsync(normalizedValues);
      form.reset(normalizedValues);
      router.refresh();
      setConfirmation("Your profile was updated successfully.");
    } catch (caughtError) {
      const generalErrors = applyBackendValidation(caughtError, form.setError, [
        "firstName",
        "lastName",
      ]);

      const fallbackMessages = profileUpdateFallbackMessages(caughtError);
      if (fallbackMessages) {
        form.setError("firstName", {
          message: fallbackMessages.firstName,
          type: "server",
        });
        form.setError("lastName", {
          message: fallbackMessages.lastName,
          type: "server",
        });
      } else {
        setError(generalErrors[0]);
      }
    } finally {
      submissionActive.current = false;
    }
  }

  return (
    <ValidatedForm
      className="mt-5 space-y-5"
      form={form}
      onSubmit={submitProfile}
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
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField<ProfileUpdateValues>
          autoComplete="given-name"
          label="First name"
          maxLength={100}
          name="firstName"
          required
        />
        <TextField<ProfileUpdateValues>
          autoComplete="family-name"
          label="Last name"
          maxLength={100}
          name="lastName"
          required
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton
          className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          pending={updateProfile.isPending}
        >
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </SubmitButton>
      </div>
    </ValidatedForm>
  );
}
