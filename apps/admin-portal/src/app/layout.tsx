import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import { AdminLayoutShell } from "@/components/admin-layout-shell";
import { branding, env } from "@/config/env";
import "./globals.css";

// Self-hosted at build time; browsers never request Google Fonts.
const outfit = Outfit({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-outfit-loaded",
});

export const metadata: Metadata = {
  title: {
    default: branding.portals.admin,
    template: `%s | ${branding.portals.admin}`,
  },
  description: env.description,
  icons: { icon: branding.favicon },
};
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html className={outfit.variable} lang="en">
      <body
        className="antialiased"
        style={{ "--brand-primary": branding.colours.primary } as CSSProperties}
      >
        <AppProviders>
          <AdminLayoutShell>{children}</AdminLayoutShell>
        </AppProviders>
      </body>
    </html>
  );
}
