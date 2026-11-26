import { isApiError } from "@template/api-client";

export type SecurityActionOutcome =
  | { message: string; status: "failed" }
  | { message: string; status: "succeeded" };

/**
 * Runs a security mutation and turns its result into user feedback. Success
 * is reported only after the backend confirms; failures use safe, mapped
 * copy (never raw exception text).
 */
export async function runSecurityAction(
  action: () => Promise<unknown>,
  successMessage: string,
  failureMessage: (error: unknown) => string,
): Promise<SecurityActionOutcome> {
  try {
    await action();
    return { message: successMessage, status: "succeeded" };
  } catch (error) {
    return { message: failureMessage(error), status: "failed" };
  }
}

/** Copy for a failed single-session or other-sessions sign-out. */
export function sessionActionError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 404) {
      return "That session was already signed out.";
    }
    if (error.status === 403) {
      return "Your current session does not have permission to manage sessions. Sign out and sign in again.";
    }
    if (error.safeMessage) {
      return error.safeMessage;
    }
  }
  return "The session could not be signed out. Try again.";
}

/** Copy for a failed active-sessions load. */
export function sessionsLoadError(error: unknown): string {
  if (isApiError(error) && error.status === 403) {
    return "Your current session does not have permission to view active sessions. Sign out and sign in again.";
  }
  return "Active sessions could not be loaded. Refresh and try again.";
}
