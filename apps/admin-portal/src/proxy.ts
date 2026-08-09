import { TENANT_ID_HEADER, type ApiTransport } from "@template/api-client";
import {
  createSignInRedirectUrl,
  createSessionRefreshCoordinator,
  hasActiveAccessToken,
  logout,
  refreshSession,
  resolveRouteSession,
  type SignInMutationResponse,
} from "@template/api-client/authentication";
import { createServerApiClient } from "@template/api-client/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/server-env";
import { hasRequiredAdminRole } from "@/lib/admin-authorization";
import {
  ACCESS_TOKEN_COOKIE,
  clearSessionCookies,
  REFRESH_TOKEN_COOKIE,
  setSessionCookies,
} from "@/lib/session-cookies";

const SIGN_IN_PATH = "/sign-in";
const coordinateSessionRefresh =
  createSessionRefreshCoordinator<SignInMutationResponse>();

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === SIGN_IN_PATH) {
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
  const requiredRole = serverEnv.ADMIN_REQUIRED_ROLE;
  const resolution = await resolveRouteSession({
    accessToken: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    isAccessTokenValid: (accessToken) =>
      hasActiveAccessToken(accessToken) &&
      hasRequiredAdminRole(accessToken, requiredRole),
    refreshSession: (refreshToken) =>
      coordinateSessionRefresh(refreshToken, async () => {
        const session = await refreshSession(client, { refreshToken });
        await requireAdminSession(client, session, requiredRole);
        return session;
      }),
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

async function requireAdminSession(
  client: ApiTransport,
  session: SignInMutationResponse,
  requiredRole: string,
): Promise<void> {
  if (hasRequiredAdminRole(session.accessToken, requiredRole)) {
    return;
  }

  try {
    await logout(client, {
      headers: { authorization: `Bearer ${session.accessToken}` },
    });
  } catch {
    // The rejected session is not persisted or returned to the browser.
  }
  throw new Error("Admin access required.");
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
