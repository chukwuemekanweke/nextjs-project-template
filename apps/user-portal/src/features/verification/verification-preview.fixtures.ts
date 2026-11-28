import type {
  VerificationAttempt,
  VerificationHistory,
  VerificationScreenModel,
  VerificationState,
  VerificationStatus,
} from "./verification-model";

/*
 * PREVIEW ONLY. Typed, deterministic fixtures for the six reference
 * `UserVerification*` states, used by tests (the isolated harness for this
 * screen). Fixed timestamps; no random or current-time data. Production
 * modules must never import this file, use it as a fallback for a failed
 * request, or expose it behind a toggle; `verification-screen.test.tsx`
 * enforces the import rule.
 */

export const FIXTURE_REJECTION_REASON =
  "FIXTURE: the document photo could not be read. Try again with a clearer photo.";

const fixtureStates: Record<VerificationStatus, VerificationState> = {
  expired: { expiredAt: "2026-01-16T09:14:00Z", status: "expired" },
  failed: { decidedAt: "2026-01-16T09:14:00Z", status: "failed" },
  inProgress: { startedAt: "2026-01-15T10:32:00Z", status: "inProgress" },
  notStarted: { status: "notStarted" },
  pending: { status: "pending", submittedAt: "2026-01-15T10:41:00Z" },
  rejected: {
    decidedAt: "2026-01-15T16:30:00Z",
    reason: FIXTURE_REJECTION_REASON,
    status: "rejected",
  },
  verified: { status: "verified", verifiedAt: "2026-01-15T10:55:00Z" },
};

/** Current verification for a state, with optional field overrides. */
export function fixtureVerification<Status extends VerificationStatus>(
  status: Status,
  overrides: Partial<Extract<VerificationState, { status: Status }>> = {},
): Extract<VerificationState, { status: Status }> {
  return {
    ...(fixtureStates[status] as Extract<
      VerificationState,
      { status: Status }
    >),
    ...overrides,
  };
}

/** One attempt row; dates are fixed per attempt number. */
export function fixtureAttempt(
  attemptNumber: number,
  status: VerificationAttempt["status"],
  overrides: Partial<VerificationAttempt> = {},
): VerificationAttempt {
  const day = String(10 + attemptNumber).padStart(2, "0");
  return {
    attemptNumber,
    id: `KYC-FIXTURE-${String(attemptNumber).padStart(4, "0")}`,
    startedAt: `2026-01-${day}T09:00:00Z`,
    status,
    updatedAt: `2026-01-${day}T09:30:00Z`,
    ...overrides,
  };
}

/**
 * History consistent with each state (newest first), instead of the
 * reference's identical sample rows on every artboard.
 */
const fixtureAttempts: Record<
  VerificationStatus,
  readonly VerificationAttempt[]
> = {
  expired: [fixtureAttempt(1, "expired")],
  failed: [fixtureAttempt(1, "failed")],
  inProgress: [fixtureAttempt(1, "inProgress", { updatedAt: undefined })],
  notStarted: [],
  pending: [fixtureAttempt(2, "pending"), fixtureAttempt(1, "rejected")],
  rejected: [fixtureAttempt(2, "rejected"), fixtureAttempt(1, "expired")],
  verified: [fixtureAttempt(2, "verified"), fixtureAttempt(1, "rejected")],
};

export function fixtureHistory(
  status: VerificationStatus,
): VerificationHistory {
  return { attempts: fixtureAttempts[status], state: "ready" };
}

/** A ready screen for a state with its consistent history. */
export function fixtureScreen(
  status: VerificationStatus,
  history: VerificationHistory = fixtureHistory(status),
): VerificationScreenModel {
  return { history, state: "ready", verification: fixtureVerification(status) };
}

export const verificationFixtureStatuses: readonly VerificationStatus[] = [
  "notStarted",
  "inProgress",
  "pending",
  "verified",
  "rejected",
  "failed",
  "expired",
];
