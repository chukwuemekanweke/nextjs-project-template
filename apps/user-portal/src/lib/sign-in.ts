export const DEFAULT_SIGN_IN_DESTINATION = "/dashboard";

export function createEmailConfirmationDestination({
  email,
  retryAtUtc,
  returnTo,
}: Readonly<{
  email: string;
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
