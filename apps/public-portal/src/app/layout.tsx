import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { Footer, Header, PublicUiProvider } from "@template/public-ui";
import { AppProviders } from "@/components/app-providers";
import { branding } from "@/config/env";
import { navigation, site } from "@/config/site";
import "./globals.css";

// Self-hosted at build time; browsers never request Google Fonts.
const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter-loaded",
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
    <html className={inter.variable} lang="en" suppressHydrationWarning>
      <body
        className="antialiased dark:bg-black"
        style={
          {
            "--brand-accent": branding.colours.accent,
            "--brand-primary": branding.colours.primary,
          } as CSSProperties
        }
      >
        <AppProviders>
          <PublicUiProvider>
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
          </PublicUiProvider>
        </AppProviders>
      </body>
    </html>
  );
}
