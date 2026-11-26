"use client";

import { isApiError } from "@template/api-client";
import {
  useCheckEmailExistence,
  useSignUp,
} from "@template/api-react/authentication";
import { useCountries } from "@template/api-react/reference-data";
import { AuthHeading } from "@template/dashboard-ui";
import {
  applyBackendValidation,
  PasswordField,
  SearchableSelectField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { Alert, ArrowLeftIcon, Divider } from "@template/ui-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { AuthFeedbackAlert } from "@/components/auth-feedback-alert";
import { GoogleAuthenticationButton } from "@/components/google-authentication-button";
import { GoogleLinkForm } from "@/components/google-link-form";
import { RegistrationSteps } from "@/components/registration-steps";
import { authLinkClassName } from "@/components/auth-link";
import { googleFeedback, type AuthFeedback } from "@/lib/auth-feedback";
import type {
  GoogleAuthenticationError,
  GoogleAuthenticationOutcome,
} from "@/lib/google-authentication";
import { googleErrorFromResponse } from "@/lib/google-authentication";
import { createPasskeySetupDestination } from "@/lib/passkey-setup";
import {
  emailSchema,
  normalizeRegistrationEmail,
  passwordSchema,
  profileSchema,
} from "@/lib/registration";
import {
  createEmailConfirmationDestination,
  createSignInHref,
} from "@/lib/sign-in";

/** "Your details" groups the profile and password schemas (DR-014). */
const detailsSchema = profileSchema.and(passwordSchema);

type EmailValues = z.infer<typeof emailSchema>;
type DetailsValues = z.infer<typeof detailsSchema>;
type ProfileValues = z.infer<typeof profileSchema>;
type RegistrationStep = "email" | "details";
type GoogleStep = "entry" | "link" | "profile";

const PASSWORD_POLICY_HINT =
  "At least 8 characters with upper- and lowercase letters, a number and a symbol.";

export function RegistrationForm({
  destination,
  googleClientId,
  googleContinuation,
}: Readonly<{
  destination: string;
  googleClientId: string;
  googleContinuation: boolean;
}>) {
  const router = useRouter();
  const checkEmail = useCheckEmailExistence();
  const signUp = useSignUp();
  const countries = useCountries();
  const countriesFailed = countries.isError;
  const refetchCountries = countries.refetch;
  const [step, setStep] = useState<RegistrationStep>("email");
  const [googleStep, setGoogleStep] = useState<GoogleStep>(
    googleContinuation ? "profile" : "entry",
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [googleError, setGoogleError] = useState<AuthFeedback>();
  const emailForm = useValidatedForm(emailSchema, {
    defaultValues: { email: "" },
    mode: "onSubmit",
  });
  const detailsForm = useValidatedForm<DetailsValues>(detailsSchema, {
    defaultValues: {
      confirmPassword: "",
      countryId: "",
      firstName: "",
      lastName: "",
      password: "",
    },
  });
  const googleProfileForm = useValidatedForm(profileSchema, {
    defaultValues: { countryId: "", firstName: "", lastName: "" },
  });
  const countryOptions = (countries.data ?? []).map((country) => ({
    label: country.name,
    secondaryLabel: country.shortCode,
    value: country.countryId,
  }));

  useEffect(() => {
    if ((step === "details" || googleStep === "profile") && countriesFailed) {
      void refetchCountries();
    }
  }, [countriesFailed, googleStep, refetchCountries, step]);

  const completeAuthentication = useCallback(() => {
    router.replace(destination);
    router.refresh();
  }, [destination, router]);

  const handleGoogleError = useCallback(
    (failure: GoogleAuthenticationError) => {
      setGoogleError(googleFeedback(failure));
    },
    [],
  );

  const handleGoogleOutcome = useCallback(
    (outcome: GoogleAuthenticationOutcome) => {
      setError(undefined);
      setGoogleError(undefined);
      if (outcome.status === "authenticated") {
        completeAuthentication();
      } else if (outcome.status === "link_required") {
        setGoogleStep("link");
      } else {
        setGoogleStep("profile");
      }
    },
    [completeAuthentication],
  );

  function restartGoogle() {
    setError(undefined);
    setGoogleError(undefined);
    setGoogleStep("entry");
    setStep("email");
  }

  async function submitEmail(values: EmailValues) {
    setError(undefined);
    setGoogleError(undefined);
    const normalizedEmail = normalizeRegistrationEmail(values.email);

    try {
      const result = await checkEmail.mutateAsync({ email: normalizedEmail });
      if (result.exists) {
        router.replace(
          createSignInHref({ email: normalizedEmail, returnTo: destination }),
        );
        return;
      }
      setEmail(normalizedEmail);
      setStep("details");
    } catch (caughtError) {
      const generalErrors = applyBackendValidation(
        caughtError,
        emailForm.setError,
        ["email"],
      );
      setError(generalErrors[0]);
    }
  }

  async function submitDetails(values: DetailsValues) {
    setError(undefined);

    try {
      const response = await signUp.mutateAsync({
        confirmPassword: values.confirmPassword,
        countryId: values.countryId,
        email,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        password: values.password,
      });
      router.replace(
        createEmailConfirmationDestination({
          email: response.email || email,
          retryAtUtc: response.retryAtUtc,
          returnTo: destination,
        }),
      );
    } catch (caughtError) {
      if (isApiError(caughtError) && caughtError.kind === "conflict") {
        router.replace(createSignInHref({ email, returnTo: destination }));
        return;
      }
      const generalErrors = applyBackendValidation(
        caughtError,
        detailsForm.setError,
        ["confirmPassword", "countryId", "firstName", "lastName", "password"],
      );
      setError(generalErrors[0]);
    }
  }

  async function submitGoogleProfile(values: ProfileValues) {
    setError(undefined);
    try {
      const response = await fetch("/api/auth/registrations/google", {
        body: JSON.stringify({
          ...values,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        const failure = await googleErrorFromResponse(response);
        const fieldErrors = failure.validationErrors ?? {};
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const normalizedField = field.toLowerCase();
          if (
            normalizedField === "countryid" ||
            normalizedField === "firstname" ||
            normalizedField === "lastname"
          ) {
            googleProfileForm.setError(
              normalizedField === "countryid"
                ? "countryId"
                : normalizedField === "firstname"
                  ? "firstName"
                  : "lastName",
              { message: messages[0] },
            );
          }
        }
        setError(
          Object.keys(fieldErrors).length > 0 ? undefined : failure.message,
        );
        return;
      }
      // A brand-new account: offer optional passkey setup before continuing.
      router.replace(createPasskeySetupDestination(destination));
      router.refresh();
    } catch {
      setError("Registration is temporarily unavailable. Try again later.");
    }
  }

  if (googleStep === "link") {
    return (
      <GoogleLinkForm
        onRestart={restartGoogle}
        onSuccess={completeAuthentication}
      />
    );
  }

  if (googleStep === "profile") {
    return (
      <>
        <AuthHeading
          description="Google has verified your identity. We just need a few details. No password needed: you'll sign in with Google."
          title="Finish creating your account"
        />
        <ValidatedForm
          className="flex flex-col gap-4"
          form={googleProfileForm}
          onSubmit={submitGoogleProfile}
        >
          {error ? <Alert variant="error">{error}</Alert> : null}
          <NameFields />
          <SearchableSelectField<ProfileValues>
            disabled={countries.isError}
            label="Country"
            loading={countries.isPending}
            name="countryId"
            options={countryOptions}
            placeholder="Search for a country"
            required
          />
          <SubmitButton fullWidth>
            {googleProfileForm.formState.isSubmitting
              ? "Creating account…"
              : "Create account"}
          </SubmitButton>
        </ValidatedForm>
        <button
          className={`${authLinkClassName} text-small self-start`}
          onClick={restartGoogle}
          type="button"
        >
          Use a different account
        </button>
      </>
    );
  }

  if (step === "details") {
    return (
      <>
        <RegistrationSteps current="details" />
        <AuthHeading
          description={
            <>
              Signing up as <b className="text-fg font-semibold">{email}</b>
              {" · "}
              <button
                className={authLinkClassName}
                onClick={() => {
                  setError(undefined);
                  setStep("email");
                }}
                type="button"
              >
                Change
              </button>
            </>
          }
          title="Tell us about you"
        />
        <ValidatedForm
          className="flex flex-col gap-4"
          form={detailsForm}
          onSubmit={submitDetails}
        >
          {error ? <Alert variant="error">{error}</Alert> : null}
          <NameFields />
          <SearchableSelectField<DetailsValues>
            disabled={countries.isError}
            label="Country"
            loading={countries.isPending}
            name="countryId"
            options={countryOptions}
            placeholder="Search for a country"
            required
          />
          <PasswordField<DetailsValues>
            autoComplete="new-password"
            hint={PASSWORD_POLICY_HINT}
            label="Password"
            name="password"
            required
          />
          <PasswordField<DetailsValues>
            autoComplete="new-password"
            label="Confirm password"
            name="confirmPassword"
            required
          />
          <SubmitButton fullWidth pending={signUp.isPending}>
            {signUp.isPending ? "Creating account…" : "Create account"}
          </SubmitButton>
        </ValidatedForm>
        <button
          className={`${authLinkClassName} text-small inline-flex items-center gap-1.5 self-start`}
          onClick={() => {
            setError(undefined);
            setStep("email");
          }}
          type="button"
        >
          <ArrowLeftIcon size="xs" />
          Back
        </button>
      </>
    );
  }

  return (
    <>
      <RegistrationSteps current="email" />
      <AuthHeading
        description="Start with your email. If you already have an account, we will take you to sign in."
        title="Create your account"
      />
      <AuthFeedbackAlert feedback={googleError} />
      <GoogleAuthenticationButton
        clientId={googleClientId}
        disabled={checkEmail.isPending}
        onError={handleGoogleError}
        onOutcome={handleGoogleOutcome}
      />
      <Divider label="or" />
      <ValidatedForm
        className="flex flex-col gap-4"
        form={emailForm}
        onSubmit={submitEmail}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <TextField<EmailValues>
          autoComplete="email"
          autoFocus
          inputMode="email"
          label="Email address"
          name="email"
          placeholder="you@example.com"
          required
        />
        <SubmitButton fullWidth pending={checkEmail.isPending}>
          {checkEmail.isPending ? "Checking…" : "Continue"}
        </SubmitButton>
      </ValidatedForm>
      <p className="text-small text-fg-muted text-center">
        Already have an account?{" "}
        <Link
          className={authLinkClassName}
          href={createSignInHref({ email, returnTo: destination })}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

/**
 * First and last name, side by side from `sm`. Both the email and the Google
 * registration forms contain the profile fields, so they share these names.
 */
function NameFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField<ProfileValues>
        autoComplete="given-name"
        autoFocus
        label="First name"
        maxLength={100}
        name="firstName"
        required
      />
      <TextField<ProfileValues>
        autoComplete="family-name"
        label="Last name"
        maxLength={100}
        name="lastName"
        required
      />
    </div>
  );
}
