import { ThemeSwitch } from "@template/ui-core";

/**
 * Dashboard top-bar light/dark switch. Kept as the dashboard-ui entry point
 * for existing shells; it delegates to the shared `ThemeSwitch`, so the theme
 * is applied before paint by the application's `ThemeProvider`.
 */
export function ThemeToggle() {
  return <ThemeSwitch />;
}
