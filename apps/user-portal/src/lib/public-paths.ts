export const SIGN_IN_PATH = "/sign-in";
export const FORGOT_PASSWORD_PATH = "/forgot-password";

/**
 * Exact pages the proxy serves without a session. Keep this list to real,
 * anonymous authentication pages; every other page requires a session.
 */
const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  SIGN_IN_PATH,
  "/sign-in/two-factor",
  "/register",
  "/confirm-email",
  FORGOT_PASSWORD_PATH,
]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}
