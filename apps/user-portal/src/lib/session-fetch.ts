"use client";

import {
  createBffSessionFetch,
  type BrowserLocation,
} from "@template/api-client/browser";

const AUTHENTICATION_PATH_PREFIX = "/api/auth/";
const SESSION_PATH = "/api/auth/session";
const SIGN_IN_PATH = "/sign-in";

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
  });
}

export const sessionFetch = createPortalSessionFetch();
