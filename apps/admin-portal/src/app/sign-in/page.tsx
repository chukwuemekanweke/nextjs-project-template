import type { Metadata } from "next";
import { Card, CardContent } from "@template/ui-core";
import { branding } from "@/config/env";
import { safeSignInDestination } from "@/lib/sign-in";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function SignInPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ returnTo?: string | string[] }>;
}>) {
  const requestedDestination = (await searchParams).returnTo;
  const destination = safeSignInDestination(
    Array.isArray(requestedDestination)
      ? requestedDestination[0]
      : requestedDestination,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-brand-600 dark:text-brand-400 text-sm font-medium">
            {branding.productName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Sign in to {branding.portals.admin}
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Access is limited to authorized administrators.
          </p>
        </div>
        <Card>
          <CardContent>
            <SignInForm destination={destination} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
