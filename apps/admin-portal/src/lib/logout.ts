const SESSION_PATH = "/api/auth/session";
const SIGN_IN_PATH = "/sign-in";

export interface PortalLogoutOptions {
  cancelPrivateRequests: () => Promise<unknown>;
  clearPrivateData: () => void;
  fetch?: typeof globalThis.fetch;
  redirect?: (href: string) => void;
}

export async function logoutPortalSession({
  cancelPrivateRequests,
  clearPrivateData,
  fetch: suppliedFetch = globalThis.fetch.bind(globalThis),
  redirect = (href) => window.location.assign(href),
}: PortalLogoutOptions): Promise<void> {
  try {
    await cancelPrivateRequests();
  } catch {
    // Continue with logout even when an active query cannot be cancelled.
  }

  try {
    await suppliedFetch(SESSION_PATH, {
      credentials: "same-origin",
      method: "DELETE",
    });
  } catch {
    // Cookie cleanup and navigation must not depend on backend availability.
  }

  try {
    clearPrivateData();
  } finally {
    redirect(SIGN_IN_PATH);
  }
}
