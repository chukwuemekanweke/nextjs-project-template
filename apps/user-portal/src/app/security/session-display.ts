import type {
  ActiveSessionResponse,
  LoginActivityResponse,
} from "@template/api-client/authentication";

type DeviceFields = Pick<
  ActiveSessionResponse | LoginActivityResponse,
  "browserName" | "devicePlatform" | "deviceName"
>;
type LocationFields = Pick<
  ActiveSessionResponse | LoginActivityResponse,
  "city" | "state" | "country"
>;

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});
const activityDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});
const activityTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeStyle: "short",
  timeZone: "UTC",
});

const ACTIVITY_TYPE_LABELS: Readonly<Record<string, string>> = {
  InitialLogin: "Successful sign in",
  TokenRefresh: "Session refreshed",
  initialLogin: "Successful sign in",
  tokenRefresh: "Session refreshed",
  sign_in_succeeded: "Successful sign in",
  sign_in_failed: "Failed sign in attempt",
  two_factor_challenge_succeeded: "Two-factor verification succeeded",
  two_factor_challenge_failed: "Two-factor verification failed",
  password_changed: "Password changed",
  session_revoked: "Session signed out",
};

/** Puts the current session first while preserving the backend's ordering otherwise. */
export function sortSessionsCurrentFirst(
  sessions: readonly ActiveSessionResponse[],
): ActiveSessionResponse[] {
  return [...sessions].sort(
    (a, b) => Number(b.isCurrent) - Number(a.isCurrent),
  );
}

/** Sorts login activity so the most recent event is always shown first. */
export function sortActivitiesNewestFirst(
  activities: readonly LoginActivityResponse[],
): LoginActivityResponse[] {
  return [...activities].sort(
    (a, b) =>
      new Date(b.occurredAtUtc).getTime() - new Date(a.occurredAtUtc).getTime(),
  );
}

export function describeDevice(fields: DeviceFields): string {
  const browser = fields.browserName?.trim();
  const platform = fields.devicePlatform?.trim();
  if (browser && platform) {
    return `${browser} on ${platform}`;
  }
  if (browser) {
    return browser;
  }
  if (platform) {
    return platform;
  }
  const deviceName = fields.deviceName?.trim();
  return deviceName || "Unknown device";
}

export function describeLocation(fields: LocationFields): string | undefined {
  const parts = [fields.city, fields.state, fields.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter(
      (part, index, values) =>
        values.findIndex(
          (candidate) =>
            candidate.toLocaleLowerCase() === part.toLocaleLowerCase(),
        ) === index,
    );
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export function ipAddressLookupUrl(ipAddress: string): string {
  return `https://whatismyipaddress.com/ip/${encodeURIComponent(ipAddress)}`;
}

export function formatRelativeTime(
  isoDateUtc: string,
  now: Date = new Date(),
): string {
  const diffMinutes = Math.round(
    (new Date(isoDateUtc).getTime() - now.getTime()) / 60_000,
  );
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
}

export function formatActivityTimestamp(isoDateUtc: string): string {
  const date = new Date(isoDateUtc);
  return `${activityDateFormatter.format(date)} at ${activityTimeFormatter.format(date)}`;
}

export function describeActivityType(activityType: string): string {
  return (
    ACTIVITY_TYPE_LABELS[activityType] ?? humanizeActivityType(activityType)
  );
}

function humanizeActivityType(activityType: string): string {
  const humanized = activityType
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
  return humanized || "Account activity";
}
