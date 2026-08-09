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
  const response = new NextResponse(null, { status: 204 });
  try {
    const client = await createAppServerApiClient();
    await logout(client);
  } catch {
    // Local logout still succeeds when the backend session has already ended.
  }
  clearSessionCookies(response);
  return response;
}
