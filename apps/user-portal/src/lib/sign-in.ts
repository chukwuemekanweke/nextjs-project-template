export const DEFAULT_SIGN_IN_DESTINATION = "/dashboard";

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

export function safeSignInError(status: number): string {
  if (status === 401) {
    return "The email or password is incorrect.";
  }
  if (status === 403) {
    return "Confirm your email address before signing in.";
  }
  if (status === 423) {
    return "This account is temporarily locked. Try again later.";
  }
  if (status === 429) {
    return "Too many sign-in attempts. Try again later.";
  }
  return "Sign-in is temporarily unavailable. Try again later.";
}
