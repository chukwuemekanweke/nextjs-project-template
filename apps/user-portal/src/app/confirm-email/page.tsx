import type { Metadata } from "next";
import { Card, CardContent } from "@template/ui-core";
import { branding } from "@/config/env";
import { safeEmailParameter } from "@/lib/sign-in";
import { ConfirmEmailForm } from "./confirm-email-form";

export const metadata: Metadata = { title: "Confirm email" };

export default async function ConfirmEmailPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ email?: string | string[] }>;
}>) {
  const suppliedEmail = (await searchParams).email;
  const email = safeEmailParameter(
    Array.isArray(suppliedEmail) ? suppliedEmail[0] : suppliedEmail,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-brand-600 dark:text-brand-400 text-sm font-medium">
            {branding.productName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Confirm your email
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Enter the 6-character code sent to {email || "your email address"}.
          </p>
        </div>
        <Card>
          <CardContent>
            <ConfirmEmailForm initialEmail={email} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
