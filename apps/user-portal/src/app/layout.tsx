import type { Metadata } from "next";
import type { ReactNode } from "react";
import { UserLayoutShell } from "@/components/user-layout-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "User Portal", template: "%s | User Portal" },
  description: "Manage your account and product activity.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <UserLayoutShell>{children}</UserLayoutShell>
      </body>
    </html>
  );
}
