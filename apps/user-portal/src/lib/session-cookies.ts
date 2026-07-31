import "server-only";

import type { SignInMutationResponse } from "@template/api-client/authentication";
import type { NextResponse } from "next/server";
import { serverEnv } from "@/config/server-env";

export const ACCESS_TOKEN_COOKIE = "template.access-token";
export const REFRESH_TOKEN_COOKIE = "template.refresh-token";

const cookieOptions = (expires: string) => ({
  expires: new Date(expires),
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: serverEnv.APP_ENVIRONMENT === "production",
});

export function setSessionCookies(
  response: NextResponse,
  session: SignInMutationResponse,
): void {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
    cookieOptions(session.expiresAtUtc),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    cookieOptions(session.refreshTokenExpiresAtUtc),
  );
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: serverEnv.APP_ENVIRONMENT === "production",
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: serverEnv.APP_ENVIRONMENT === "production",
  });
}
