const PUBLIC_AUTHENTICATION_PATHS = new Set([
  "/confirm-email",
  "/register",
  "/sign-in",
]);

export function usesDashboardShell(pathname: string): boolean {
  return !(
    PUBLIC_AUTHENTICATION_PATHS.has(pathname) ||
    pathname.startsWith("/sign-in/")
  );
}
