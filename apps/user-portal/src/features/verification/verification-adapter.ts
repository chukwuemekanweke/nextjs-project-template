import type { GetCurrentKycVerificationQueryResponse } from "@template/api-client/kyc";
import type {
  VerificationScreenModel,
  VerificationState,
} from "./verification-model";

/** Maps the backend lifecycle into the approved presentation lifecycle. */
export function toVerificationState(
  response: GetCurrentKycVerificationQueryResponse,
): VerificationState | undefined {
  // Stakeholder verification is authoritative even if an older attempt is
  // returned or a future attempt status is introduced.
  if (response.isVerified) {
    return {
      status: "verified",
      verifiedAt: response.completedAtUtc ?? undefined,
    };
  }

  switch (response.status) {
    case "NotStarted":
      return { status: "notStarted" };
    case "Pending":
      return {
        preparing: !response.verificationUrl,
        startedAt: response.startedAtUtc ?? undefined,
        status: "inProgress",
      };
    case "InProgress":
      return {
        status: "pending",
        submittedAt: response.submittedAtUtc ?? undefined,
      };
    case "Verified":
      // Never infer success from the attempt status when the stakeholder flag
      // does not confirm it.
      return undefined;
    case "Rejected":
      return {
        decidedAt: response.completedAtUtc ?? undefined,
        status: "rejected",
      };
    case "Failed":
      return {
        decidedAt: response.completedAtUtc ?? undefined,
        status: "failed",
      };
    case "Expired":
      return {
        expiredAt: response.completedAtUtc ?? undefined,
        status: "expired",
      };
    default:
      return undefined;
  }
}

export function toVerificationScreenModel(
  response: GetCurrentKycVerificationQueryResponse | undefined,
  state: "error" | "loading" | "ready",
): VerificationScreenModel {
  if (state === "loading") return { state: "loading" };
  if (state === "error" || !response) return { state: "error" };
  const verification = toVerificationState(response);
  if (!verification) {
    return { history: { state: "unavailable" }, state: "unknown" };
  }
  return {
    history: { state: "unavailable" },
    state: "ready",
    verification,
  };
}
