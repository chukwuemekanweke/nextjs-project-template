// Authentication-flow pages use the standalone sign-in/register layout. This is
// presentation only: `/passkey-setup` still requires a session in the proxy.
const AUTHENTICATION_LAYOUT_PATHS = new Set([
  "/confirm-email",
  "/passkey-setup",
  "/register",
  "/sign-in",
]);

export function usesDashboardShell(pathname: string): boolean {
  return !(
    AUTHENTICATION_LAYOUT_PATHS.has(pathname) ||
    pathname.startsWith("/sign-in/")
  );
}
