"use client";

import { createRefreshCoordinatedFetch } from "@template/api-client/browser";

const SESSION_PATH = "/api/auth/session";
const REFRESH_PATH = `${SESSION_PATH}/refresh`;
const SIGN_IN_PATH = "/sign-in";

type PortalLocation = Pick<Location, "hash" | "origin" | "pathname" | "search">;

export interface PortalSessionFetchOptions {
  fetch?: typeof globalThis.fetch;
  getLocation?: () => PortalLocation;
  redirect?: (href: string) => void;
}

export function createPortalSessionFetch({
  fetch: suppliedFetch = globalThis.fetch.bind(globalThis),
  getLocation = () => window.location,
  redirect = (href) => window.location.assign(href),
}: PortalSessionFetchOptions = {}): typeof globalThis.fetch {
  return createRefreshCoordinatedFetch({
    fetch: suppliedFetch,
    onSessionExpired: async () => {
      try {
        await suppliedFetch(SESSION_PATH, {
          credentials: "same-origin",
          method: "DELETE",
        });
      } catch {
        // Redirect even when the best-effort backend logout is unavailable.
      }
      redirect(signInDestination(getLocation()));
    },
    refreshSession: async () => {
      try {
        const response = await suppliedFetch(REFRESH_PATH, {
          credentials: "same-origin",
          method: "POST",
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    shouldRefreshRequest: (input) => {
      const location = getLocation();
      const url = resolveRequestUrl(input, location.origin);
      return (
        url?.origin === location.origin &&
        !url.pathname.startsWith("/api/auth/") &&
        url.pathname !== SIGN_IN_PATH
      );
    },
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

function signInDestination(location: PortalLocation): string {
  if (location.pathname === SIGN_IN_PATH) {
    return SIGN_IN_PATH;
  }
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return `${SIGN_IN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

export const sessionFetch = createPortalSessionFetch();
