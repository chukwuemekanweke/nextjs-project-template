import { isApiError } from "@template/api-client";
import type { StartKycVerificationMutationResponse } from "@template/api-client/kyc";

export function safeVerificationUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function describeKycStartError(error: unknown): string {
  if (!isApiError(error)) {
    return "Verification could not be started. Check your connection and try again.";
  }
  switch (error.status) {
    case 400:
      return "Add your first and last name in Profile before starting verification.";
    case 404:
      return "Your profile is not ready for verification yet. Try again later.";
    case 409:
      return "Your verification state changed. Refreshing the latest status.";
    case 503:
      return "Your verification session is unavailable or still being prepared. Try again shortly.";
    default:
      return error.status === 401
        ? "Your session has expired. Sign in again to continue verification."
        : "Verification could not be started. Try again.";
  }
}

export type VerificationStartOutcome =
  | Readonly<{ type: "ignored" }>
  | Readonly<{ type: "redirect"; href: string }>
  | Readonly<{ type: "preparing" }>
  | Readonly<{ type: "error"; message: string }>;

/**
 * Runs at most one start/resume request at a time and navigates only to a
 * backend-returned HTTPS URL. The backend remains the duplicate-flow guard.
 */
export function createVerificationStarter({
  navigate,
  start,
}: Readonly<{
  navigate: (href: string) => void;
  start: () => Promise<StartKycVerificationMutationResponse>;
}>) {
  let inFlight = false;
  return {
    get inFlight() {
      return inFlight;
    },
    async run(): Promise<VerificationStartOutcome> {
      if (inFlight) return { type: "ignored" };
      inFlight = true;
      try {
        const response = await start();
        const href = safeVerificationUrl(response.verificationUrl);
        if (!href) return { type: "preparing" };
        navigate(href);
        return { href, type: "redirect" };
      } catch (error) {
        return { message: describeKycStartError(error), type: "error" };
      } finally {
        inFlight = false;
      }
    },
  };
}
