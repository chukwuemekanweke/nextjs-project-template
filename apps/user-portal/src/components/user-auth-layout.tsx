import { AuthLayout, AuthPanel, DashboardBrand } from "@template/dashboard-ui";
import { FingerprintIcon, LockIcon } from "@template/ui-core";
import type { ReactNode } from "react";
import { branding } from "@/config/env";

const panelHighlights = [
  { icon: <FingerprintIcon />, label: "Passkeys and 2FA" },
  { icon: <LockIcon />, label: "Encrypted sessions" },
] as const;

/**
 * Customer authentication layout: shared `AuthLayout` with the User Portal
 * brand, copyright and brand-panel copy. Pages supply the flow content.
 */
export function UserAuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <AuthLayout
      brand={<DashboardBrand href="/" name={branding.productName} />}
      footer={branding.copyright}
      panel={
        <AuthPanel
          description="Sign in once and manage your profile, security and subscription from a single place."
          highlights={panelHighlights}
          title="One account for everything you build."
        />
      }
    >
      {children}
    </AuthLayout>
  );
}
