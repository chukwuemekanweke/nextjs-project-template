import type { Metadata } from "next";
import { UserAuthLayout } from "@/components/user-auth-layout";
import { env } from "@/config/env";
import { safeEmailParameter, safeSignInDestination } from "@/lib/sign-in";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    confirmed?: string | string[];
    email?: string | string[];
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
  const requestedEmail = parameters.email;
  const initialEmail = safeEmailParameter(
    Array.isArray(requestedEmail) ? requestedEmail[0] : requestedEmail,
  );
  const suppliedConfirmed = parameters.confirmed;
  const confirmed =
    (Array.isArray(suppliedConfirmed)
      ? suppliedConfirmed[0]
      : suppliedConfirmed) === "true";

  return (
    <UserAuthLayout>
      <SignInForm
        destination={destination}
        emailConfirmed={confirmed}
        googleClientId={env.googleClientId}
        initialEmail={initialEmail}
      />
    </UserAuthLayout>
  );
}
