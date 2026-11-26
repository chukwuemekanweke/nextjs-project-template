import { isApiError } from "@template/api-client";
import type { SecurityActivityResponse } from "@template/api-client/authentication";
import {
  ActivityIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  IconTile,
  KeyIcon,
  LogOutIcon,
  RefreshIcon,
  ShieldCheckIcon,
  type IconTileTone,
} from "@template/ui-core";
import type { ReactNode } from "react";
import {
  describeActivityPresentation,
  sortActivitiesNewestFirst,
  type ActivityIconKind,
  type ActivityTone,
} from "./session-display";

/**
 * Page size of the security-activity query. The overview and the Activity
 * tab use the same value so they share one cached infinite query.
 */
export const SECURITY_ACTIVITY_PAGE_SIZE = 10;

const ACTIVITY_ICONS: Readonly<Record<ActivityIconKind, ReactNode>> = {
  activity: <ActivityIcon />,
  alert: <CircleAlertIcon />,
  check: <CircleCheckIcon />,
  key: <KeyIcon />,
  logout: <LogOutIcon />,
  refresh: <RefreshIcon />,
  shield: <ShieldCheckIcon />,
};

const ACTIVITY_TILE_TONES: Readonly<Record<ActivityTone, IconTileTone>> = {
  brand: "brand",
  danger: "danger",
  neutral: "neutral",
  success: "success",
};

/** Decorative icon tile for an activity type; unknown types stay neutral. */
export function ActivityEventIcon({
  activityType,
  size = "md",
}: Readonly<{ activityType: string; size?: "sm" | "md" }>) {
  const presentation = describeActivityPresentation(activityType);
  return (
    <IconTile size={size} tone={ACTIVITY_TILE_TONES[presentation.tone]}>
      {ACTIVITY_ICONS[presentation.icon]}
    </IconTile>
  );
}

/** Flattens the loaded activity pages, newest first. */
export function loadedActivities(
  pages: readonly { activities: readonly SecurityActivityResponse[] }[] = [],
): SecurityActivityResponse[] {
  return sortActivitiesNewestFirst(pages.flatMap((page) => page.activities));
}

/** Safe copy for a failed security-activity load (shared by both views). */
export function securityActivityError(error: unknown): string {
  if (isApiError(error) && error.status === 403) {
    return "Your current session does not have permission to view security activity. Sign out and sign in again.";
  }
  return "Security activity could not be loaded. Refresh and try again.";
}

/** Inline text link used across the Security tabs. */
export const securityLinkClassName =
  "text-brand-ink focus-visible:outline-focus rounded-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2";
