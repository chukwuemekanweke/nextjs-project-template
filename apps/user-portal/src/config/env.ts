const DEFAULT_API_BASE_URL = "http://localhost:5000";

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
});
