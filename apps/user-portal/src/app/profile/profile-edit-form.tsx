"use client";

import { useUpdateProfile } from "@template/api-react/profiles";
import {
  Alert,
  Badge,
  Button,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from "@template/ui-core";
import {
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { profileUpdateSchema } from "@/lib/profile-editing";
import {
  submitProfileUpdate,
  type ProfileUpdateValues,
} from "./profile-update-submission";

/**
 * Personal information card (reference "Personal information"). Only first
 * and last name are editable (`UpdateProfileRequest`); the email address is
 * read-only. Country and "last updated" have no backend field (DR-019), so
 * the header shows the account verification status instead.
 */
export function ProfileEditForm({
  emailAddress,
  firstName,
  isVerified,
  lastName,
}: Readonly<{
  emailAddress: string;
  firstName: string;
  isVerified: boolean;
  lastName: string;
}>) {
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
  const { isDirty } = form.formState;
  const isSaving = updateProfile.isPending;

  async function submitProfile(values: ProfileUpdateValues) {
    if (submissionActive.current) {
      return;
    }

    submissionActive.current = true;
    setError(undefined);
    setConfirmation(undefined);

    try {
      const result = await submitProfileUpdate(values, {
        setError: form.setError,
        update: (request) => updateProfile.mutateAsync(request),
      });
      if (result.status === "saved") {
        form.reset(result.values);
        router.refresh();
        setConfirmation("Your profile was updated successfully.");
      } else {
        setError(result.message);
      }
    } finally {
      submissionActive.current = false;
    }
  }

  return (
    <ValidatedForm
      aria-labelledby="personal-information-heading"
      form={form}
      onSubmit={submitProfile}
    >
      <CardHeader>
        <CardTitle id="personal-information-heading">
          Personal information
        </CardTitle>
        <VerificationBadge isVerified={isVerified} />
      </CardHeader>
      <CardContent className="space-y-5">
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
        <div className="grid gap-5 md:grid-cols-2">
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
          <FormField
            descriptionId="profile-email-hint"
            hint="Your email address cannot be changed here."
            inputId="profile-email"
            label="Email address"
          >
            <Input
              aria-describedby="profile-email-hint"
              autoComplete="email"
              id="profile-email"
              readOnly
              type="email"
              value={emailAddress.trim()}
            />
          </FormField>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          disabled={!isDirty || isSaving}
          onClick={() => {
            form.reset();
            setError(undefined);
          }}
          variant="ghost"
        >
          Cancel
        </Button>
        <SubmitButton pending={isSaving}>
          {isSaving ? "Saving…" : "Save changes"}
        </SubmitButton>
      </CardFooter>
    </ValidatedForm>
  );
}

/**
 * Account verification from `profile.isVerified`. This is not identity
 * verification (KYC), which has no API (DR-054).
 */
function VerificationBadge({ isVerified }: Readonly<{ isVerified: boolean }>) {
  return isVerified ? (
    <Badge tone="success">Verified</Badge>
  ) : (
    <Badge tone="warning">Verification pending</Badge>
  );
}
