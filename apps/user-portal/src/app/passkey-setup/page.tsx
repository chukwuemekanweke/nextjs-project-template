import type { Metadata } from "next";
import { AuthHeading } from "@template/dashboard-ui";
import { FingerprintIcon, IconTile } from "@template/ui-core";
import { UserAuthLayout } from "@/components/user-auth-layout";
import { safeSignInDestination } from "@/lib/sign-in";
import { PasskeySetupPrompt } from "./passkey-setup-prompt";

export const metadata: Metadata = { title: "Set up a passkey" };

export default async function PasskeySetupPage({
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
      <AuthHeading
        description="Your account is ready. Use your fingerprint, face or device PIN instead of a password next time. Passkeys can't be phished and stay on your device."
        icon={
          <IconTile className="size-14 rounded-[14px]" size="lg">
            <FingerprintIcon />
          </IconTile>
        }
        title="Sign in faster with a passkey"
      />
      <PasskeySetupPrompt destination={destination} />
    </UserAuthLayout>
  );
}
