import type { BadgeTone } from "@template/ui-core";
import type {
  AdminMetric,
  AdminRangePreset,
} from "@/components/admin-patterns";
import type {
  AdminBadge,
  AdminScreenBlocked,
  AdminSection,
} from "@/features/admin-users/admin-view";

/*
 * Admin KYC monitoring view models (ADM-KYC, ADM-KYC-DETAIL).
 *
 * There is no KYC API (DR-054): nothing in production builds these models.
 * Verification decisions belong to the provider; the admin view is
 * read-only apart from asking for the latest status, which is an intent
 * the future adapter performs. Statuses the source does not recognise map
 * to `"unknown"`.
 */

export const ADMIN_KYC_STATUSES = [
  "notStarted",
  "inProgress",
  "pending",
  "verified",
  "rejected",
  "failed",
  "expired",
] as const;

export type AdminKycStatus = (typeof ADMIN_KYC_STATUSES)[number] | "unknown";

const kycLabels: Record<AdminKycStatus, string> = {
  expired: "Expired",
  failed: "Failed",
  inProgress: "In progress",
  notStarted: "Not started",
  pending: "Pending",
  rejected: "Rejected",
  unknown: "Unknown",
  verified: "Verified",
};

const kycTones: Record<AdminKycStatus, BadgeTone> = {
  expired: "neutral",
  failed: "danger",
  inProgress: "info",
  notStarted: "neutral",
  pending: "warning",
  rejected: "danger",
  unknown: "neutral",
  verified: "success",
};

export function kycStatusBadge(status: AdminKycStatus): AdminBadge {
  return { label: kycLabels[status], tone: kycTones[status] };
}

/** Maps a raw value to a known status; anything else is `"unknown"`. */
export function parseAdminKycStatus(value: unknown): AdminKycStatus {
  return (ADMIN_KYC_STATUSES as readonly unknown[]).includes(value)
    ? (value as AdminKycStatus)
    : "unknown";
}

export type AdminKycUser = Readonly<{
  id: string;
  displayName: string;
  email: string;
  country?: string;
}>;

/** One row of the reference KYC monitoring table. */
export type AdminKycListItem = Readonly<{
  /** Verification id. */
  id: string;
  user: AdminKycUser;
  status: AdminKycStatus;
  provider?: string;
  /** Provider's verification reference, shown in monospace. */
  providerReference?: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
}>;

export type AdminKycFilters = Readonly<{
  query: string;
  status: AdminKycStatus | "any";
  /** Provider value from `providerOptions`, or "any". */
  provider: string;
  range: AdminRangePreset;
}>;

export const DEFAULT_ADMIN_KYC_FILTERS: AdminKycFilters = {
  provider: "any",
  query: "",
  range: "30d",
  status: "any",
};

export function hasActiveKycFilters(filters: AdminKycFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.status !== "any" ||
    filters.provider !== "any"
  );
}

/** The four reference stat tiles; each is its own metric state. */
export type AdminKycCounts = Readonly<{
  pending: AdminMetric;
  inProgress: AdminMetric;
  verified: AdminMetric;
  rejectedOrFailed: AdminMetric;
}>;

export type AdminKycListModel =
  | AdminScreenBlocked
  | Readonly<{
      state: "ready";
      counts: AdminKycCounts;
      items: readonly AdminKycListItem[];
      page: number;
      pageSize: number;
      totalItems?: number;
      totalPages: number;
    }>;

export type AdminKycVerification = Readonly<{
  id: string;
  user: AdminKycUser;
  status: AdminKycStatus;
  /** Provider's own status text, shown verbatim when supplied. */
  providerStatus?: string;
  provider?: string;
  providerReference?: string;
  applicantId?: string;
  attemptNumber?: number;
  attemptCount?: number;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
}>;

/** One entry of the reference "Status history" timeline (newest first). */
export type AdminKycHistoryEvent = Readonly<{
  id: string;
  label: string;
  occurredAt?: string;
  /** Extra source detail, for example "signature valid". */
  detail?: string;
}>;

export type AdminKycAttempt = Readonly<{
  id: string;
  attemptNumber: number;
  status: AdminKycStatus;
  startedAt?: string;
  completedAt?: string;
}>;

export type AdminKycDetailModel =
  | AdminScreenBlocked
  | Readonly<{ state: "notFound" }>
  | Readonly<{
      state: "ready";
      verification: AdminKycVerification;
      history: AdminSection<readonly AdminKycHistoryEvent[]>;
      attempts: AdminSection<readonly AdminKycAttempt[]>;
    }>;

/** "Attempt #3 of 3", "Attempt #3" or `undefined` when not reported. */
export function kycAttemptLabel(
  verification: Pick<AdminKycVerification, "attemptNumber" | "attemptCount">,
): string | undefined {
  const { attemptCount, attemptNumber } = verification;
  if (!attemptNumber) return undefined;
  return attemptCount && attemptCount >= attemptNumber
    ? `Attempt #${attemptNumber} of ${attemptCount}`
    : `Attempt #${attemptNumber}`;
}

/** Read-only notice; names the provider only when the source does. */
export function kycDecisionNotice(provider: string | undefined): string {
  const decidedBy = provider?.trim() || "the verification provider";
  return `Approval and rejection are decided by ${decidedBy}. This page is read-only apart from refreshing the latest status.`;
}
