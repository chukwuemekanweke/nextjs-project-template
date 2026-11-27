import {
  GOOGLE_AUTH_ERROR_CODES,
  type GoogleAuthenticationError,
} from "./google-authentication";
import type { PasswordResetFailure } from "./password-reset";
import { safeSignInError } from "./sign-in";

/**
 * Titled inline feedback for authentication screens (design `AuthStates`).
 * Titles and tone are chosen from the HTTP status or the backend's stable
 * error code; the body reuses the existing safe copy. Never add attempt
 * counts, lockout durations or account-existence hints: the backend does
 * not return them, and they would leak security-relevant detail.
 */
export type AuthFeedback = Readonly<{
  message: string;
  title: string;
  variant: "error" | "info" | "success" | "warning";
}>;

export function signInFeedback(status: number): AuthFeedback {
  if (status === 401) {
    return {
      message: "Check your details and try again.",
      title: "Incorrect email or password",
      variant: "error",
    };
  }
  if (status === 423) {
    return {
      message: safeSignInError(status),
      title: "Account locked",
      variant: "error",
    };
  }
  if (status === 429) {
    return {
      message: safeSignInError(status),
      title: "Too many requests",
      variant: "warning",
    };
  }
  return {
    message: safeSignInError(status),
    title: "Sign-in unavailable",
    variant: "error",
  };
}

export function googleFeedback(error: GoogleAuthenticationError): AuthFeedback {
  switch (error.code) {
    case GOOGLE_AUTH_ERROR_CODES.accountLocked:
      return {
        message: error.message,
        title: "Account locked",
        variant: "error",
      };
    case GOOGLE_AUTH_ERROR_CODES.rateLimited:
      return {
        message: error.message,
        title: "Too many requests",
        variant: "warning",
      };
    case GOOGLE_AUTH_ERROR_CODES.emailVerificationRequired:
      return {
        message: error.message,
        title: "Email not confirmed",
        variant: "warning",
      };
    case GOOGLE_AUTH_ERROR_CODES.invalidCredentials:
      return {
        message: error.message,
        title: "Incorrect password",
        variant: "error",
      };
    default:
      return {
        message: error.message,
        title: "Google sign-in failed",
        variant: "error",
      };
  }
}

/** Passkey errors have no stable code; the message is already status-specific. */
export function passkeyFeedback(message: string): AuthFeedback {
  return { message, title: "Passkey sign-in failed", variant: "error" };
}

export function twoFactorFeedback({
  message,
  method,
  status,
}: Readonly<{
  message: string;
  method: "authenticator" | "recovery_code";
  status: number;
}>): AuthFeedback {
  if (status === 401) {
    return method === "authenticator"
      ? {
          message:
            "Check the time on your phone is set automatically, then try the newest code.",
          title: "Invalid authenticator code",
          variant: "error",
        }
      : { message, title: "Invalid recovery code", variant: "error" };
  }
  if (status === 429) {
    return { message, title: "Too many attempts", variant: "warning" };
  }
  return { message, title: "Verification unavailable", variant: "error" };
}

/**
 * Password-reset feedback. Copy never reveals whether an account exists,
 * how many attempts remain or how long a limit lasts: the backend returns
 * none of that, and the first would enable account enumeration.
 */
export function passwordResetFeedback(
  failure: Exclude<PasswordResetFailure, "validation">,
  operation: "complete" | "request" | "resend",
): AuthFeedback {
  if (failure === "invalid_code") {
    return {
      message: "It's wrong, expired or already used. Request a new code.",
      title: "That code didn't work",
      variant: "error",
    };
  }
  if (failure === "rate_limited") {
    return {
      message: "Please wait a few minutes before trying again.",
      title: "Too many requests",
      variant: "warning",
    };
  }
  return operation === "complete"
    ? {
        message:
          "Your password wasn't changed. Check your connection and try again.",
        title: "Password reset unavailable",
        variant: "error",
      }
    : {
        message: "Check your connection and try again.",
        title: "We couldn't send a code",
        variant: "error",
      };
}

/**
 * A repeated request is accepted even when nothing is sent: while an earlier
 * code is still valid the backend keeps it instead of issuing a new one.
 */
export const passwordResetResentFeedback: AuthFeedback = {
  message:
    "If an account uses this address, we'll email it a code. An earlier code that hasn't expired stays valid, so use the most recent one you received.",
  title: "Code requested",
  variant: "info",
};
