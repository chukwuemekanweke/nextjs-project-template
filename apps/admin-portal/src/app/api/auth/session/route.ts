import {
  logout,
  signIn,
  type SignInMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";
import { clearSessionCookies, setSessionCookies } from "@/lib/session-cookies";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const session = await signIn(
      client,
      (await request.json()) as SignInMutationRequest,
    );
    const response = NextResponse.json({
      expiresAtUtc: session.expiresAtUtc,
      tokenType: session.tokenType,
    });
    setSessionCookies(response, session);
    return response;
  } catch (error) {
    return apiRouteError(error);
  }
}

export async function DELETE() {
  try {
    const client = await createAppServerApiClient();
    await logout(client);
    const response = new NextResponse(null, { status: 204 });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    const response = apiRouteError(error);
    clearSessionCookies(response);
    return response;
  }
}
