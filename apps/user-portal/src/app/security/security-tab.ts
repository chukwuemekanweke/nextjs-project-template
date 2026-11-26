/**
 * The Security page's URL-addressable sections (`/security?tab=…`). The
 * order is the tab order; `overview` is the default.
 */
export const SECURITY_TABS = [
  { label: "Overview", value: "overview" },
  { label: "Password", value: "password" },
  { label: "Passkeys", value: "passkeys" },
  { label: "Two-factor", value: "two-factor" },
  { label: "Sessions", value: "sessions" },
  { label: "Activity", value: "activity" },
] as const;

export type SecurityTab = (typeof SECURITY_TABS)[number]["value"];

export const DEFAULT_SECURITY_TAB: SecurityTab = "overview";

const SECURITY_TAB_VALUES = new Set<string>(
  SECURITY_TABS.map((tab) => tab.value),
);

export function isSecurityTab(value: unknown): value is SecurityTab {
  return typeof value === "string" && SECURITY_TAB_VALUES.has(value);
}

/**
 * Tab from a `?tab=` query value. Missing, repeated or unknown values fall
 * back to the overview rather than failing.
 */
export function parseSecurityTab(
  value: string | readonly string[] | null | undefined,
): SecurityTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized =
    typeof candidate === "string" ? candidate.trim().toLowerCase() : undefined;
  return isSecurityTab(normalized) ? normalized : DEFAULT_SECURITY_TAB;
}

/** Same-page link for a tab; the overview keeps the bare `/security` URL. */
export function securityTabHref(tab: SecurityTab): string {
  return tab === DEFAULT_SECURITY_TAB ? "/security" : `/security?tab=${tab}`;
}
