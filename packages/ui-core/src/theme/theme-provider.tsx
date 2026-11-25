"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { themeProviderSettings } from "./theme-config";

/**
 * Light, dark and system theme management for a portal. Render it once, near
 * the root of the application's provider tree. next-themes injects a blocking
 * script that applies the stored (or system) theme to <html> before first
 * paint, so the root layout must set `suppressHydrationWarning` on <html>.
 */
export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <NextThemesProvider
      {...themeProviderSettings}
      themes={[...themeProviderSettings.themes]}
    >
      {children}
    </NextThemesProvider>
  );
}
