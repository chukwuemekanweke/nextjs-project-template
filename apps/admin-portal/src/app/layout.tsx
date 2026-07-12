import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminLayoutShell } from "@/components/admin-layout-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Admin Portal", template: "%s | Admin Portal" },
  description: "Operate and administer the platform.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </body>
    </html>
  );
}
