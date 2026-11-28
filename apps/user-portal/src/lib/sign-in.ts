import { FORGOT_PASSWORD_PATH } from "./public-paths";

export const DEFAULT_SIGN_IN_DESTINATION = "/dashboard";

/** Why confirmation is shown outside registration (presentation only). */
export const EMAIL_NOT_CONFIRMED_REASON = "email_not_confirmed";

export function createEmailConfirmationDestination({
  email,
  reason,
  retryAtUtc,
  returnTo,
}: Readonly<{
  email: string;
  reason?: typeof EMAIL_NOT_CONFIRMED_REASON;
  retryAtUtc?: string;
  returnTo: string;
}>): string {
  const parameters = new URLSearchParams({
    email: safeEmailParameter(email),
    returnTo: safeSignInDestination(returnTo),
  });
  if (retryAtUtc && Number.isFinite(Date.parse(retryAtUtc))) {
    parameters.set("retryAtUtc", retryAtUtc);
  }
  if (reason === EMAIL_NOT_CONFIRMED_REASON) {
    parameters.set("reason", reason);
  }
  return `/confirm-email?${parameters.toString()}`;
}

export function safeEmailParameter(value: string | undefined): string {
  if (!value) {
    return "";
  }
  const normalized = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
}

export function safeSignInDestination(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_SIGN_IN_DESTINATION;
  }

  try {
    const destination = new URL(value, "http://portal.local");
    if (destination.origin !== "http://portal.local") {
      return DEFAULT_SIGN_IN_DESTINATION;
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return DEFAULT_SIGN_IN_DESTINATION;
  }
}

/** Sign-in link that keeps a non-default, validated destination. */
export function createSignInHref({
  email,
  returnTo,
}: Readonly<{ email?: string; returnTo?: string }> = {}): string {
  return withAuthenticationParameters("/sign-in", { email, returnTo });
}

/** Password-recovery link that keeps a non-default, validated destination. */
export function createForgotPasswordHref(returnTo?: string): string {
  return withAuthenticationParameters(FORGOT_PASSWORD_PATH, { returnTo });
}

/** Registration link that keeps a non-default, validated destination. */
export function createRegistrationHref(returnTo?: string): string {
  return withAuthenticationParameters("/register", { returnTo });
}

function withAuthenticationParameters(
  path: string,
  { email, returnTo }: Readonly<{ email?: string; returnTo?: string }>,
): string {
  const parameters = new URLSearchParams();
  const safeEmail = safeEmailParameter(email);
  if (safeEmail) parameters.set("email", safeEmail);
  const destination = safeSignInDestination(returnTo);
  if (destination !== DEFAULT_SIGN_IN_DESTINATION) {
    parameters.set("returnTo", destination);
  }
  const query = parameters.toString();
  return query ? `${path}?${query}` : path;
}

export function createTwoFactorDestination(returnTo: string): string {
  const parameters = new URLSearchParams({
    returnTo: safeSignInDestination(returnTo),
  });
  return `/sign-in/two-factor?${parameters.toString()}`;
}

export function safeSignInError(status: number): string {
  if (status === 401) {
    return "The email or password is incorrect.";
  }
  if (status === 423) {
    return "This account is temporarily locked. Try again later.";
  }
  if (status === 429) {
    return "Too many sign-in attempts. Try again later.";
  }
  return "Sign-in is temporarily unavailable. Try again later.";
}
