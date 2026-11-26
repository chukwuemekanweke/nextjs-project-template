import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { MarketingFooter } from "@template/public-ui";
import { AppProviders } from "@/components/app-providers";
import { SiteBrand } from "@/components/site-brand";
import { SiteHeader } from "@/components/site-header";
import { branding } from "@/config/env";
import { footerNavigation, site } from "@/config/site";
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
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
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
        className="flex min-h-screen flex-col antialiased"
        style={
          {
            "--brand-accent": branding.colours.accent,
            "--brand-primary": branding.colours.primary,
          } as CSSProperties
        }
      >
        <AppProviders>
          <SiteHeader brand={<SiteBrand />} />
          {children}
          <MarketingFooter
            brand={<SiteBrand />}
            copyright={branding.copyright}
            description={site.description}
            groups={footerNavigation}
          />
        </AppProviders>
      </body>
    </html>
  );
}
