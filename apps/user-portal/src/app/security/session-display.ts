import type {
  ActiveSessionResponse,
  SecurityActivityResponse,
} from "@template/api-client/authentication";

type DeviceFields = Pick<
  ActiveSessionResponse | SecurityActivityResponse,
  "browserName" | "devicePlatform" | "deviceName"
>;
type LocationFields = Pick<
  ActiveSessionResponse | SecurityActivityResponse,
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
  FailedSignIn: "Failed sign in attempt",
  PasskeyAdded: "Passkey added",
  PasskeyRemoved: "Passkey removed",
  TwoFactorEnabled: "Two-factor authentication enabled",
  TwoFactorDisabled: "Two-factor authentication disabled",
  TwoFactorRecoveryCodesRegenerated: "Recovery codes regenerated",
  PasswordChanged: "Password changed",
};

const FAILURE_REASON_LABELS: Readonly<Record<string, string>> = {
  email_not_verified: "Email address not verified",
  invalid_credentials: "Incorrect password",
  invalid_two_factor_code: "Incorrect two-factor code",
  locked_out: "Account temporarily locked",
  user_not_found: "Account not found",
};

/** Puts the current session first while preserving the backend's ordering otherwise. */
export function sortSessionsCurrentFirst(
  sessions: readonly ActiveSessionResponse[],
): ActiveSessionResponse[] {
  return [...sessions].sort(
    (a, b) => Number(b.isCurrent) - Number(a.isCurrent),
  );
}

/** Sorts security activity so the most recent event is always shown first. */
export function sortActivitiesNewestFirst(
  activities: readonly SecurityActivityResponse[],
): SecurityActivityResponse[] {
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

/** Readable failure reason for a failed sign-in; undefined when absent. */
export function describeFailureReason(
  failureReason: string | null | undefined,
): string | undefined {
  const reason = failureReason?.trim();
  if (!reason) return undefined;
  return FAILURE_REASON_LABELS[reason] ?? humanize(reason, reason);
}

function humanizeActivityType(activityType: string): string {
  return humanize(activityType, "Account activity");
}

function humanize(value: string, fallback: string): string {
  const humanized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
  return humanized || fallback;
}

export type BrowserIconKind =
  "chrome" | "edge" | "firefox" | "safari" | "mobile" | "desktop";

const MOBILE_PLATFORM = /\b(android|ios|iphone|ipad|ipados|mobile|tablet)\b/i;

/**
 * Chooses a recognisable browser icon, falling back to a generic phone or
 * desktop icon when the browser is unknown or has no dedicated mark.
 */
export function browserIconKind(fields: DeviceFields): BrowserIconKind {
  const browser = fields.browserName?.trim().toLowerCase() ?? "";
  // Edge's user agent also names Chrome, so it must be matched first.
  if (browser.includes("edge")) return "edge";
  if (browser.includes("firefox")) return "firefox";
  if (browser.includes("chrom")) return "chrome";
  if (browser.includes("safari")) return "safari";
  const device = [fields.devicePlatform, fields.deviceName, fields.browserName]
    .filter(Boolean)
    .join(" ");
  return MOBILE_PLATFORM.test(device) ? "mobile" : "desktop";
}

export type ActivityIconKind =
  "check" | "alert" | "key" | "shield" | "logout" | "refresh" | "activity";
export type ActivityTone = "success" | "danger" | "brand" | "neutral";

const ACTIVITY_PRESENTATION: Readonly<
  Record<string, { icon: ActivityIconKind; tone: ActivityTone }>
> = {
  InitialLogin: { icon: "check", tone: "success" },
  TokenRefresh: { icon: "refresh", tone: "neutral" },
  FailedSignIn: { icon: "alert", tone: "danger" },
  PasskeyAdded: { icon: "key", tone: "brand" },
  PasskeyRemoved: { icon: "key", tone: "neutral" },
  TwoFactorEnabled: { icon: "shield", tone: "success" },
  TwoFactorDisabled: { icon: "shield", tone: "danger" },
  TwoFactorRecoveryCodesRegenerated: { icon: "shield", tone: "brand" },
  PasswordChanged: { icon: "key", tone: "brand" },
};

/** Icon and semantic tone for a security activity event; unknown types stay neutral. */
export function describeActivityPresentation(activityType: string): {
  icon: ActivityIconKind;
  tone: ActivityTone;
} {
  return (
    ACTIVITY_PRESENTATION[activityType] ?? { icon: "activity", tone: "neutral" }
  );
}
