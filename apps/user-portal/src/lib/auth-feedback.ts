import {
  GOOGLE_AUTH_ERROR_CODES,
  type GoogleAuthenticationError,
} from "./google-authentication";
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
