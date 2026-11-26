import type { BadgeTone } from "@template/ui-core";

/*
 * Status presentation for admin badges. Each feature owns its own status →
 * badge map (business meaning stays with the feature); this module only
 * makes the lookup safe for arbitrary runtime values.
 */

/** Badge text and tone. The text always carries the meaning. */
export type AdminBadge = Readonly<{ label: string; tone: BadgeTone }>;

/** Shown for a missing, empty or unrecognised status. */
export const UNKNOWN_ADMIN_BADGE: AdminBadge = {
  label: "Unknown",
  tone: "neutral",
};

/**
 * Looks up a status the backend returned. Only the map's own keys match, so
 * values such as "constructor" or "__proto__" fall back instead of
 * resolving inherited properties. Unknown or empty values get a neutral
 * badge, never a successful one.
 */
export function lookupAdminBadge(
  badges: Readonly<Record<string, AdminBadge>>,
  status: string | null | undefined,
  fallback: AdminBadge = UNKNOWN_ADMIN_BADGE,
): AdminBadge {
  if (!status || !Object.hasOwn(badges, status)) {
    return fallback;
  }
  return badges[status] ?? fallback;
}
