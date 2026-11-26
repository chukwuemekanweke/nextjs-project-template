import type { Metadata } from "next";
import { UserAuthLayout } from "@/components/user-auth-layout";
import { env } from "@/config/env";
import { safeSignInDestination } from "@/lib/sign-in";
import { RegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    google?: string | string[];
    returnTo?: string | string[];
  }>;
}>) {
  const parameters = await searchParams;
  const requestedDestination = parameters.returnTo;
  const destination = safeSignInDestination(
    Array.isArray(requestedDestination)
      ? requestedDestination[0]
      : requestedDestination,
  );
  const requestedGoogle = parameters.google;
  const googleContinuation =
    (Array.isArray(requestedGoogle) ? requestedGoogle[0] : requestedGoogle) ===
    "continue";

  return (
    <UserAuthLayout>
      <RegistrationForm
        destination={destination}
        googleClientId={env.googleClientId}
        googleContinuation={googleContinuation}
      />
    </UserAuthLayout>
  );
}
