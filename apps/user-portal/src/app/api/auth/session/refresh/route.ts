import { refreshSession } from "@template/api-client/authentication";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";
import {
  clearSessionCookies,
  REFRESH_TOKEN_COOKIE,
  setSessionCookies,
} from "@/lib/session-cookies";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { title: "Authentication required", status: 401 },
      { status: 401 },
    );
  }
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const session = await refreshSession(client, { refreshToken });
    const response = NextResponse.json({
      expiresAtUtc: session.expiresAtUtc,
      tokenType: session.tokenType,
    });
    setSessionCookies(response, session);
    return response;
  } catch (error) {
    const response = apiRouteError(error);
    if (response.status === 401 || response.status === 403) {
      clearSessionCookies(response);
    }
    return response;
  }
}
