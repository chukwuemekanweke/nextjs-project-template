import "server-only";

import type { SignInMutationResponse } from "@template/api-client/authentication";
import type { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  expiredSessionCookie,
  LEGACY_SESSION_COOKIES,
  persistentSessionCookie,
  REFRESH_TOKEN_COOKIE,
} from "./session-cookie-policy";

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };

export function setSessionCookies(
  response: NextResponse,
  session: SignInMutationResponse,
): void {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
    persistentSessionCookie(session.expiresAtUtc),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    persistentSessionCookie(session.refreshTokenExpiresAtUtc),
  );
  clearLegacySessionCookies(response);
}

export function clearSessionCookies(response: NextResponse): void {
  for (const cookieName of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
    response.cookies.set(cookieName, "", expiredSessionCookie);
  }
  clearLegacySessionCookies(response);
}

function clearLegacySessionCookies(response: NextResponse): void {
  for (const cookieName of LEGACY_SESSION_COOKIES) {
    response.cookies.set(cookieName, "", expiredSessionCookie);
  }
}
