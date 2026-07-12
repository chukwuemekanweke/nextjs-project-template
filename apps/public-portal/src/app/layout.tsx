import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer, Header, PublicUiProvider } from "@template/public-ui";
import { navigation, site } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  icons: { icon: "/images/favicon.ico" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark:bg-black">
        <PublicUiProvider>
          <Header
            logoAlt={site.name}
            navigation={navigation}
            signIn={site.signIn}
            register={site.register}
          />
          {children}
          <Footer
            description={site.description}
            navigation={navigation}
            legal={[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ]}
          />
        </PublicUiProvider>
      </body>
    </html>
  );
}
