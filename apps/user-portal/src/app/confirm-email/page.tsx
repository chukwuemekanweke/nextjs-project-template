import type { Metadata } from "next";
import { UserAuthLayout } from "@/components/user-auth-layout";
import { safeRetryAtUtc } from "@/lib/registration";
import {
  EMAIL_NOT_CONFIRMED_REASON,
  safeEmailParameter,
  safeSignInDestination,
} from "@/lib/sign-in";
import { ConfirmEmailForm } from "./confirm-email-form";

export const metadata: Metadata = { title: "Confirm email" };

export default async function ConfirmEmailPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    email?: string | string[];
    reason?: string | string[];
    returnTo?: string | string[];
    retryAtUtc?: string | string[];
  }>;
}>) {
  const parameters = await searchParams;
  const suppliedEmail = parameters.email;
  const email = safeEmailParameter(
    Array.isArray(suppliedEmail) ? suppliedEmail[0] : suppliedEmail,
  );
  const suppliedRetryAtUtc = parameters.retryAtUtc;
  const retryAtUtc = safeRetryAtUtc(
    Array.isArray(suppliedRetryAtUtc)
      ? suppliedRetryAtUtc[0]
      : suppliedRetryAtUtc,
  );
  const suppliedDestination = parameters.returnTo;
  const destination = safeSignInDestination(
    Array.isArray(suppliedDestination)
      ? suppliedDestination[0]
      : suppliedDestination,
  );

  const suppliedReason = parameters.reason;
  const emailNotConfirmed =
    (Array.isArray(suppliedReason) ? suppliedReason[0] : suppliedReason) ===
    EMAIL_NOT_CONFIRMED_REASON;

  return (
    <UserAuthLayout>
      <ConfirmEmailForm
        emailNotConfirmed={emailNotConfirmed}
        initialEmail={email}
        initialNowUtc={new Date().toISOString()}
        initialRetryAtUtc={retryAtUtc}
        signInDestination={destination}
      />
    </UserAuthLayout>
  );
}
