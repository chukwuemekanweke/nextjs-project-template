const DEFAULT_API_BASE_URL = "http://localhost:5000";
const DEFAULT_USER_PORTAL_URL = "http://localhost:3000";

function readUrl(value: string | undefined, fallback: string): string {
  const candidate = value || fallback;
  new URL(candidate);
  return candidate.replace(/\/$/, "");
}

export const env = Object.freeze({
  apiBaseUrl: readUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    DEFAULT_API_BASE_URL,
  ),
  userPortalUrl: readUrl(
    process.env.NEXT_PUBLIC_USER_PORTAL_URL,
    DEFAULT_USER_PORTAL_URL,
  ),
});

export function userPortalHref(path: `/${string}`): string {
  return `${env.userPortalUrl}${path}`;
}
