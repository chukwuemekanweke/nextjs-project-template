/** Documented provider-independent KYC statuses returned by the backend. */
export const kycVerificationStatuses = [
  "NotStarted",
  "Pending",
  "InProgress",
  "Verified",
  "Rejected",
  "Failed",
  "Expired",
] as const;

export type KycVerificationStatus = (typeof kycVerificationStatuses)[number];

/**
 * Current authoritative KYC state for the authenticated stakeholder.
 *
 * `status` remains a string so future backend values degrade safely in the
 * application adapter instead of being silently treated as a known state.
 */
export type GetCurrentKycVerificationQueryResponse = Readonly<{
  completedAtUtc: string | null;
  isVerified: boolean;
  provider: string | null;
  startedAtUtc: string | null;
  status: string;
  submittedAtUtc: string | null;
  verificationId: string | null;
  verificationUrl: string | null;
}>;

/** Start, resume, or restart response. The operation has no request body. */
export type StartKycVerificationMutationResponse = Readonly<{
  provider: string;
  status: string;
  verificationId: string;
  verificationUrl: string | null;
}>;

export const kycOperations = {
  getCurrentKycVerification: {
    method: "GET",
    path: "/api/v1/stakeholders/me/kyc",
  },
  startKycVerification: {
    method: "POST",
    path: "/api/v1/stakeholders/me/kyc/start",
  },
} as const;
