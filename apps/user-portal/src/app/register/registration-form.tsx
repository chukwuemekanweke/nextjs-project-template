"use client";

import { isApiError } from "@template/api-client";
import {
  useCheckEmailExistence,
  useSignUp,
} from "@template/api-react/authentication";
import { useCountries } from "@template/api-react/reference-data";
import {
  applyBackendValidation,
  PasswordField,
  SearchableSelectField,
  SubmitButton,
  TextField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { z } from "zod";
import {
  emailSchema,
  normalizeRegistrationEmail,
  passwordSchema,
  profileSchema,
} from "@/lib/registration";

type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;
type ProfileValues = z.infer<typeof profileSchema>;
type RegistrationStep = "email" | "profile" | "password";

export function RegistrationForm() {
  const router = useRouter();
  const checkEmail = useCheckEmailExistence();
  const signUp = useSignUp();
  const countries = useCountries();
  const countriesFailed = countries.isError;
  const refetchCountries = countries.refetch;
  const [step, setStep] = useState<RegistrationStep>("email");
  const [email, setEmail] = useState("");
  const [profileValues, setProfileValues] = useState<ProfileValues>();
  const [error, setError] = useState<string>();
  const emailForm = useValidatedForm(emailSchema, {
    defaultValues: { email: "" },
  });
  const profileForm = useValidatedForm(profileSchema, {
    defaultValues: { countryId: "", firstName: "", lastName: "" },
  });
  const passwordForm = useValidatedForm(passwordSchema, {
    defaultValues: { confirmPassword: "", password: "" },
  });

  useEffect(() => {
    if (step === "profile" && countriesFailed) {
      void refetchCountries();
    }
  }, [countriesFailed, refetchCountries, step]);

  async function submitEmail(values: EmailValues) {
    setError(undefined);
    const normalizedEmail = normalizeRegistrationEmail(values.email);

    try {
      const result = await checkEmail.mutateAsync({ email: normalizedEmail });
      if (result.exists) {
        router.replace(`/sign-in?email=${encodeURIComponent(normalizedEmail)}`);
        return;
      }
      setEmail(normalizedEmail);
      setStep("profile");
    } catch (caughtError) {
      const generalErrors = applyBackendValidation(
        caughtError,
        emailForm.setError,
        ["email"],
      );
      setError(generalErrors[0]);
    }
  }

  function submitProfile(values: ProfileValues) {
    setError(undefined);
    setProfileValues(values);
    setStep("password");
  }

  async function submitPassword(values: PasswordValues) {
    if (!profileValues) {
      setStep("profile");
      return;
    }
    setError(undefined);

    try {
      const response = await signUp.mutateAsync({
        ...profileValues,
        ...values,
        email,
        firstName: profileValues.firstName.trim(),
        lastName: profileValues.lastName.trim(),
      });
      const retryAtUtc = response.retryAtUtc
        ? `&retryAtUtc=${encodeURIComponent(response.retryAtUtc)}`
        : "";
      router.replace(
        `/confirm-email?email=${encodeURIComponent(response.email || email)}${retryAtUtc}`,
      );
    } catch (caughtError) {
      if (isApiError(caughtError) && caughtError.kind === "conflict") {
        router.replace(`/sign-in?email=${encodeURIComponent(email)}`);
        return;
      }
      const generalErrors = applyBackendValidation(
        caughtError,
        passwordForm.setError,
        ["confirmPassword", "password"],
      );
      setError(generalErrors[0]);
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />
      {error ? <FormError message={error} /> : null}
      {step === "email" ? (
        <ValidatedForm
          className="space-y-5"
          form={emailForm}
          onSubmit={submitEmail}
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Start with your email
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We’ll check whether you already have an account.
            </p>
          </div>
          <TextField<EmailValues>
            autoComplete="email"
            autoFocus
            inputMode="email"
            label="Email address"
            name="email"
            placeholder="you@example.com"
            required
          />
          <PrimarySubmit pending={checkEmail.isPending}>Continue</PrimarySubmit>
        </ValidatedForm>
      ) : null}
      {step === "profile" ? (
        <ValidatedForm
          className="space-y-5"
          form={profileForm}
          onSubmit={submitProfile}
        >
          <StepHeading
            description="Tell us who you are and where you’re based."
            title="Complete your profile"
          />
          <div className="grid gap-5 sm:grid-cols-2">
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
          <SearchableSelectField<ProfileValues>
            disabled={countries.isError}
            label="Country"
            loading={countries.isPending}
            name="countryId"
            options={(countries.data ?? []).map((country) => ({
              label: country.name,
              secondaryLabel: country.shortCode,
              value: country.countryId,
            }))}
            placeholder="Search for a country"
            required
          />
          <StepActions onBack={() => setStep("email")} />
        </ValidatedForm>
      ) : null}
      {step === "password" ? (
        <ValidatedForm
          className="space-y-5"
          form={passwordForm}
          onSubmit={submitPassword}
        >
          <StepHeading
            description={`Create a secure password for ${email}.`}
            title="Secure your account"
          />
          <PasswordField<PasswordValues>
            autoComplete="new-password"
            autoFocus
            label="Password"
            name="password"
            required
          />
          <PasswordField<PasswordValues>
            autoComplete="new-password"
            label="Confirm password"
            name="confirmPassword"
            required
          />
          <StepActions
            onBack={() => setStep("profile")}
            pending={signUp.isPending}
            submitLabel="Create account"
          />
        </ValidatedForm>
      ) : null}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
          href={
            email ? `/sign-in?email=${encodeURIComponent(email)}` : "/sign-in"
          }
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function StepIndicator({ current }: Readonly<{ current: RegistrationStep }>) {
  const stepNumber: Record<RegistrationStep, number> = {
    email: 1,
    password: 3,
    profile: 2,
  };
  const currentStep = stepNumber[current];

  return (
    <div className="flex justify-end">
      <span
        aria-label={`Step ${currentStep} of 3`}
        className="bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 inline-flex min-w-14 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums"
        role="status"
      >
        {currentStep} / 3
      </span>
    </div>
  );
}

function StepHeading({
  description,
  title,
}: Readonly<{ description: string; title: string }>) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function PrimarySubmit({
  children,
  pending = false,
}: Readonly<{ children: string; pending?: boolean }>) {
  return (
    <SubmitButton
      className="bg-brand-500 hover:bg-brand-600 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      pending={pending}
    >
      {pending ? "Please wait…" : children}
    </SubmitButton>
  );
}

function StepActions({
  onBack,
  pending = false,
  submitLabel = "Continue",
}: Readonly<{
  onBack: () => void;
  pending?: boolean;
  submitLabel?: string;
}>) {
  return (
    <div className="flex gap-3">
      <button
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        onClick={onBack}
        type="button"
      >
        Back
      </button>
      <PrimarySubmit pending={pending}>{submitLabel}</PrimarySubmit>
    </div>
  );
}

function FormError({ message }: Readonly<{ message: string }>) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      role="alert"
    >
      {message}
    </div>
  );
}
