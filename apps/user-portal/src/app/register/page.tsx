import type { Metadata } from "next";
import { Card, CardContent } from "@template/ui-core";
import { branding } from "@/config/env";
import { RegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <p className="text-brand-600 dark:text-brand-400 text-sm font-medium">
            {branding.productName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            We’ll guide you through a few quick steps.
          </p>
        </div>
        <Card>
          <CardContent>
            <RegistrationForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
