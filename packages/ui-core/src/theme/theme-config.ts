// Shared theme-management settings. Kept free of React so applications,
// tests and server code can import them without creating a client boundary.

/**
 * localStorage key holding the explicit preference. It matches the key used
 * by the earlier dashboard toggle and the public portal, so preferences saved
 * before the shared provider remain valid. Each portal is its own origin, so
 * each keeps an independent preference.
 */
export const THEME_STORAGE_KEY = "theme";

export const themePreferences = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof themePreferences)[number];

/** Settings passed to next-themes by `ThemeProvider` (TD-07). */
export const themeProviderSettings = {
  /** `.dark` / `.light` on <html>; theme.css swaps semantic tokens on `.dark`. */
  attribute: "class",
  defaultTheme: "system",
  /** Avoids colour transitions flashing across the page while switching. */
  disableTransitionOnChange: true,
  /** Sets `color-scheme` so native controls and scrollbars match. */
  enableColorScheme: true,
  enableSystem: true,
  storageKey: THEME_STORAGE_KEY,
  themes: ["light", "dark"],
} as const;

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (themePreferences as readonly string[]).includes(value)
  );
}
