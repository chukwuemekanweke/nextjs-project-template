import type { Metadata } from "next";
import { UserAuthLayout } from "@/components/user-auth-layout";
import { safeSignInDestination } from "@/lib/sign-in";
import { TwoFactorSignInForm } from "./two-factor-sign-in-form";

export const metadata: Metadata = { title: "Two-factor verification" };

export default async function TwoFactorSignInPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ returnTo?: string | string[] }>;
}>) {
  const parameters = await searchParams;
  const requestedDestination = parameters.returnTo;
  const destination = safeSignInDestination(
    Array.isArray(requestedDestination)
      ? requestedDestination[0]
      : requestedDestination,
  );

  return (
    <UserAuthLayout>
      <TwoFactorSignInForm destination={destination} />
    </UserAuthLayout>
  );
}
