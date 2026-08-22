import type { Metadata } from "next";
import { Card, CardContent } from "@template/ui-core";
import { branding } from "@/config/env";
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-brand-600 dark:text-brand-400 text-sm font-medium">
            {branding.productName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Sign in to {branding.portals.user}
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Use the credentials associated with your account.
          </p>
        </div>
        <Card>
          <CardContent>
            {confirmed ? (
              <div
                className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300"
                role="status"
              >
                Your email is confirmed. Enter your password to sign in.
              </div>
            ) : null}
            <SignInForm destination={destination} initialEmail={initialEmail} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
