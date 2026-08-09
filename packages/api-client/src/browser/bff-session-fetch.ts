import { createRefreshCoordinatedFetch } from "./refresh-coordinated-fetch";

export type BrowserLocation = Pick<
  Location,
  "hash" | "origin" | "pathname" | "search"
>;

export interface BffSessionFetchOptions {
  authenticationPathPrefix: string;
  fetch: typeof globalThis.fetch;
  getLocation: () => BrowserLocation;
  redirect: (href: string) => void;
  sessionPath: string;
  signInPath: string;
}

export function createBffSessionFetch({
  authenticationPathPrefix,
  fetch,
  getLocation,
  redirect,
  sessionPath,
  signInPath,
}: BffSessionFetchOptions): typeof globalThis.fetch {
  const refreshPath = `${sessionPath}/refresh`;

  async function refreshSession(): Promise<boolean> {
    try {
      const response = await fetch(refreshPath, {
        credentials: "same-origin",
        method: "POST",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function expireSession(): Promise<void> {
    try {
      await fetch(sessionPath, {
        credentials: "same-origin",
        method: "DELETE",
      });
    } catch {
      // Redirect even when the best-effort backend logout is unavailable.
    }
    redirect(getSignInDestination(getLocation(), signInPath));
  }

  function shouldRefresh(input: RequestInfo | URL): boolean {
    const location = getLocation();
    const url = resolveRequestUrl(input, location.origin);
    return (
      url?.origin === location.origin &&
      !url.pathname.startsWith(authenticationPathPrefix) &&
      url.pathname !== signInPath
    );
  }

  return createRefreshCoordinatedFetch({
    fetch,
    onSessionExpired: expireSession,
    refreshSession,
    shouldRefreshRequest: shouldRefresh,
  });
}

function resolveRequestUrl(
  input: RequestInfo | URL,
  origin: string,
): URL | undefined {
  try {
    const value = input instanceof Request ? input.url : input.toString();
    return new URL(value, origin);
  } catch {
    return undefined;
  }
}

function getSignInDestination(
  location: BrowserLocation,
  signInPath: string,
): string {
  if (location.pathname === signInPath) {
    return signInPath;
  }
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return `${signInPath}?returnTo=${encodeURIComponent(returnTo)}`;
}
