"use client";

import {
  createBffSessionFetch,
  type BrowserLocation,
} from "@template/api-client/browser";

const AUTHENTICATION_PATH_PREFIX = "/api/auth/";
const SESSION_PATH = "/api/auth/session";
const SIGN_IN_PATH = "/sign-in";
const RETRYABLE_UNAUTHORIZED_CODES = new Set(["invalid_two_factor_code"]);

export interface PortalSessionFetchOptions {
  fetch?: typeof globalThis.fetch;
  getLocation?: () => BrowserLocation;
  redirect?: (href: string) => void;
}

export function createPortalSessionFetch(
  options: PortalSessionFetchOptions = {},
): typeof globalThis.fetch {
  const {
    fetch = globalThis.fetch.bind(globalThis),
    getLocation = () => window.location,
    redirect = (href) => window.location.assign(href),
  } = options;
  return createBffSessionFetch({
    authenticationPathPrefix: AUTHENTICATION_PATH_PREFIX,
    fetch,
    getLocation,
    redirect,
    sessionPath: SESSION_PATH,
    signInPath: SIGN_IN_PATH,
    shouldRefreshResponse: isSessionAuthenticationFailure,
  });
}

export const sessionFetch = createPortalSessionFetch();

async function isSessionAuthenticationFailure(
  response: Response,
): Promise<boolean> {
  try {
    const payload = (await response.json()) as { code?: unknown };
    return (
      typeof payload.code !== "string" ||
      !RETRYABLE_UNAUTHORIZED_CODES.has(payload.code)
    );
  } catch {
    return true;
  }
}
