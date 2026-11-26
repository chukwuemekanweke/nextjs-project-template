import type { BadgeTone, IconTileTone } from "@template/ui-core";

/*
 * Identity verification (KYC) view model for USR-VERIFICATION.
 *
 * There is no KYC API yet (DR-054): nothing in production builds this model.
 * A future adapter (CAF-FE-006) maps authoritative backend data into it; it
 * must not invent statuses, dates or reasons the backend did not return.
 * Values that cannot be mapped become `{ state: "unknown" }` (screen) or
 * `"unknown"` (attempt status) rather than a guessed state.
 */

/** The six lifecycle states drawn in the reference `UserVerification*`. */
export type VerificationStatus =
  "notStarted" | "inProgress" | "pending" | "verified" | "rejected" | "expired";

/**
 * Current verification, one variant per lifecycle state. Dates are ISO 8601
 * timestamps from the authoritative source and are optional: when absent the
 * copy omits them instead of using the current time.
 */
export type VerificationState =
  | Readonly<{ status: "notStarted" }>
  | Readonly<{ status: "inProgress"; startedAt?: string }>
  | Readonly<{ status: "pending"; submittedAt?: string }>
  | Readonly<{ status: "verified"; verifiedAt?: string }>
  | Readonly<{
      status: "rejected";
      decidedAt?: string;
      /** Reason shown to the user, only when the source supplies one. */
      reason?: string;
      /** `false` when the source says another attempt is not allowed. */
      retryAllowed?: boolean;
    }>
  | Readonly<{ status: "expired"; expiredAt?: string }>;

export type VerificationAttemptStatus = VerificationStatus | "unknown";

/** One row of the reference "Verification history" table. */
export type VerificationAttempt = Readonly<{
  id: string;
  /** Sequence number shown as "#3". */
  attemptNumber: number;
  startedAt: string;
  status: VerificationAttemptStatus;
  updatedAt?: string;
}>;

export type VerificationHistory =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error" }>
  /** History is not provided by the source; the section is omitted. */
  | Readonly<{ state: "unavailable" }>
  | Readonly<{ state: "ready"; attempts: readonly VerificationAttempt[] }>;

/** Everything the verification screen renders. */
export type VerificationScreenModel =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error" }>
  /** The source returned a status this client does not recognise. */
  | Readonly<{ state: "unknown"; history: VerificationHistory }>
  | Readonly<{
      state: "ready";
      history: VerificationHistory;
      verification: VerificationState;
    }>;

/**
 * Presentation intents. The screen only reports which one the user chose;
 * starting, resuming or retrying with the provider is the adapter's job.
 */
export type VerificationIntent = "start" | "continue" | "retry" | "refresh";

export type VerificationAction = Readonly<{
  intent: VerificationIntent;
  label: string;
  variant: "primary" | "secondary";
}>;

/** The single action the reference offers for a state, if any. */
export function verificationActionFor(
  verification: VerificationState,
): VerificationAction | null {
  switch (verification.status) {
    case "notStarted":
      return {
        intent: "start",
        label: "Start verification",
        variant: "primary",
      };
    case "inProgress":
      return {
        intent: "continue",
        label: "Continue verification",
        variant: "primary",
      };
    case "pending":
      // Under review: only re-read the status, never start a duplicate.
      return {
        intent: "refresh",
        label: "Refresh status",
        variant: "secondary",
      };
    case "verified":
      return null;
    case "rejected":
      return verification.retryAllowed === false
        ? null
        : { intent: "retry", label: "Try again", variant: "primary" };
    case "expired":
      return { intent: "start", label: "Start again", variant: "primary" };
  }
}

/** Text shown to assistive technology when an action has no handler. */
export const UNAVAILABLE_ACTION_DESCRIPTION =
  "Identity verification is not available yet.";

const statusLabels: Record<VerificationAttemptStatus, string> = {
  expired: "Expired",
  inProgress: "In progress",
  notStarted: "Not started",
  pending: "Pending",
  rejected: "Rejected",
  unknown: "Unknown",
  verified: "Verified",
};

const statusTones: Record<VerificationAttemptStatus, BadgeTone> = {
  expired: "neutral",
  inProgress: "info",
  notStarted: "neutral",
  pending: "warning",
  rejected: "danger",
  unknown: "neutral",
  verified: "success",
};

/** Badge text and tone for a status; the text always carries the meaning. */
export function verificationStatusBadge(status: VerificationAttemptStatus): {
  label: string;
  tone: BadgeTone;
} {
  return { label: statusLabels[status], tone: statusTones[status] };
}

/** Icon tile tone of the status panel (reference `.ico`, `.ok/.warn/.bad`). */
export function verificationPanelTone(
  status: VerificationStatus | "unknown",
): IconTileTone {
  switch (status) {
    case "verified":
      return "success";
    case "rejected":
      return "danger";
    case "pending":
    case "expired":
      return "warning";
    case "unknown":
      return "neutral";
    default:
      return "brand";
  }
}

const DISPLAY_LOCALE = "en-US";

/**
 * Formats a source timestamp for display, or `undefined` when it is missing
 * or invalid. Never substitutes the current time.
 */
export function formatVerificationDateTime(
  value: string | undefined,
  {
    locale = DISPLAY_LOCALE,
    timeZone,
  }: { locale?: string; timeZone?: string } = {},
): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(timestamp);
}

export function formatVerificationDate(
  value: string | undefined,
  {
    locale = DISPLAY_LOCALE,
    timeZone,
  }: { locale?: string; timeZone?: string } = {},
): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  }).format(timestamp);
}

/** Display options shared by every date on the screen. */
export type VerificationDateOptions = Readonly<{
  locale?: string;
  timeZone?: string;
}>;

export type VerificationStatusCopy = Readonly<{
  title: string;
  description: string;
}>;

/**
 * Heading and body text for a state. Sample reference copy that would be a
 * claim (turnaround times, email follow-up, payouts and limits, a reason for
 * an unexplained rejection) is replaced by neutral wording.
 */
export function verificationStatusCopy(
  verification: VerificationState,
  dates: VerificationDateOptions = {},
): VerificationStatusCopy {
  switch (verification.status) {
    case "notStarted":
      return {
        title: "Verify your identity",
        description:
          "You haven't started verification yet. Have a photo ID ready before you begin.",
      };
    case "inProgress":
      return {
        title: "Verification in progress",
        description:
          "You started verification but haven't finished. Pick up where you left off.",
      };
    case "pending": {
      const submitted = formatVerificationDateTime(
        verification.submittedAt,
        dates,
      );
      return {
        title: "We're reviewing your documents",
        description: submitted
          ? `Submitted ${submitted}. The decision will appear here when the review is complete.`
          : "The decision will appear here when the review is complete.",
      };
    }
    case "verified": {
      const verified = formatVerificationDate(verification.verifiedAt, dates);
      return {
        title: "You're verified",
        description: verified
          ? `Verified on ${verified}. No further action is needed.`
          : "Your identity has been verified. No further action is needed.",
      };
    }
    case "rejected": {
      const reason = verification.reason?.trim();
      return {
        title: "Verification was not approved",
        description: reason || "No reason was provided for this decision.",
      };
    }
    case "expired":
      return {
        title: "Your verification session expired",
        description:
          "The verification session timed out before it was completed. Start a new attempt.",
      };
  }
}
