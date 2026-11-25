import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import { AdminLayoutShell } from "@/components/admin-layout-shell";
import { branding, env } from "@/config/env";
import "./globals.css";

// Self-hosted at build time; browsers never request Google Fonts. The
// variables feed --font-sans / --font-mono in @template/ui-core/theme.css.
const outfit = Outfit({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-outfit-loaded",
});
const jetBrainsMono = JetBrains_Mono({
  display: "swap",
  preload: false,
  subsets: ["latin"],
  variable: "--font-jetbrains-mono-loaded",
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
    // suppressHydrationWarning: next-themes sets the theme class and
    // color-scheme on <html> before hydration.
    <html
      className={`${outfit.variable} ${jetBrainsMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
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
