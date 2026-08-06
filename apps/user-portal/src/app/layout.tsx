import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import { UserLayoutShell } from "@/components/user-layout-shell";
import { branding, env } from "@/config/env";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: branding.portals.user,
    template: `%s | ${branding.portals.user}`,
  },
  description: env.description,
  icons: { icon: branding.favicon },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{ "--brand-primary": branding.colours.primary } as CSSProperties}
      >
        <AppProviders>
          <UserLayoutShell>{children}</UserLayoutShell>
        </AppProviders>
      </body>
    </html>
  );
}
