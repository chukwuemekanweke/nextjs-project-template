import { TENANT_ID_HEADER } from "@template/api-client";
import {
  createSignInRedirectUrl,
  createSessionRefreshCoordinator,
  hasActiveAccessToken,
  refreshSession,
  resolveRouteSession,
  type SignInMutationResponse,
} from "@template/api-client/authentication";
import { createServerApiClient } from "@template/api-client/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/server-env";
import {
  ACCESS_TOKEN_COOKIE,
  clearSessionCookies,
  REFRESH_TOKEN_COOKIE,
  setSessionCookies,
} from "@/lib/session-cookies";

const SIGN_IN_PATH = "/sign-in";
const PUBLIC_PATHS = new Set([SIGN_IN_PATH, "/register", "/confirm-email"]);
const coordinateSessionRefresh =
  createSessionRefreshCoordinator<SignInMutationResponse>();

export async function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const client = createServerApiClient({
    baseUrl: serverEnv.API_BASE_URL,
    defaultCache: "no-store",
    defaultHeaders: {
      [TENANT_ID_HEADER]: serverEnv.TENANT_ID,
      ...forwardedHeaders(request),
    },
  });
  const resolution = await resolveRouteSession({
    accessToken: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    isAccessTokenValid: hasActiveAccessToken,
    refreshSession: (refreshToken) =>
      coordinateSessionRefresh(refreshToken, () =>
        refreshSession(client, { refreshToken }),
      ),
    refreshToken: request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
  });

  if (resolution.status === "active") {
    return NextResponse.next();
  }
  if (resolution.status === "refreshed") {
    const response = NextResponse.next();
    setSessionCookies(response, resolution.session);
    return response;
  }

  const response = NextResponse.redirect(
    createSignInRedirectUrl(request.nextUrl, SIGN_IN_PATH),
  );
  clearSessionCookies(response);
  return response;
}

function forwardedHeaders(request: NextRequest): Record<string, string> {
  return Object.fromEntries(
    ["traceparent", "user-agent", "x-correlation-id"].flatMap((name) => {
      const value = request.headers.get(name);
      return value ? [[name, value]] : [];
    }),
  );
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
