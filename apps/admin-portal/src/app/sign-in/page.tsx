import type { Metadata } from "next";
import { AuthLayout, AuthPanel, DashboardBrand } from "@template/dashboard-ui";
import { LockIcon, ShieldCheckIcon } from "@template/ui-core";
import { branding } from "@/config/env";
import { safeSignInDestination } from "@/lib/sign-in";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Admin sign in" };

const panelHighlights = [
  { icon: <ShieldCheckIcon />, label: "Role-based access" },
  { icon: <LockIcon />, label: "Encrypted sessions" },
] as const;

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
    <AuthLayout
      brand={<DashboardBrand href="/" name={branding.productName} />}
      footer={branding.copyright}
      panel={
        <AuthPanel
          description="Administer the platform from an access-controlled console."
          highlights={panelHighlights}
          title="Operations console"
        />
      }
    >
      <SignInForm destination={destination} />
    </AuthLayout>
  );
}
