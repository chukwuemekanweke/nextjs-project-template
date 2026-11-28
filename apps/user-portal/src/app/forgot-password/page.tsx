import type { Metadata } from "next";
import { UserAuthLayout } from "@/components/user-auth-layout";
import { safeSignInDestination } from "@/lib/sign-in";
import { ForgotPasswordFlow } from "./forgot-password-flow";

export const metadata: Metadata = { title: "Reset password" };

/**
 * Public forgotten-password recovery. Only the validated post-sign-in
 * destination is read from the URL; the email, code and passwords stay in
 * client state and never appear in the address.
 */
export default async function ForgotPasswordPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ returnTo?: string | string[] }>;
}>) {
  const parameters = await searchParams;
  const suppliedDestination = parameters.returnTo;
  const destination = safeSignInDestination(
    Array.isArray(suppliedDestination)
      ? suppliedDestination[0]
      : suppliedDestination,
  );

  return (
    <UserAuthLayout>
      <ForgotPasswordFlow signInDestination={destination} />
    </UserAuthLayout>
  );
}
