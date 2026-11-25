import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { Footer, Header } from "@template/public-ui";
import { AppProviders } from "@/components/app-providers";
import { branding } from "@/config/env";
import { navigation, site } from "@/config/site";
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
      {/* bg-white / dark:bg-black keep the Solid marketing backgrounds until
          the marketing chrome migrates (FE-UI-009). */}
      <body
        className="bg-white antialiased dark:bg-black"
        style={
          {
            "--brand-accent": branding.colours.accent,
            "--brand-primary": branding.colours.primary,
          } as CSSProperties
        }
      >
        <AppProviders>
          <Header
            logoAlt={site.name}
            logo={branding.logo}
            navigation={navigation}
            signIn={site.signIn}
            register={site.register}
          />
          {children}
          <Footer
            description={site.description}
            copyright={branding.copyright}
            navigation={navigation}
            legal={[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ]}
            logo={branding.logo}
            logoAlt={branding.logo.alt}
          />
        </AppProviders>
      </body>
    </html>
  );
}
