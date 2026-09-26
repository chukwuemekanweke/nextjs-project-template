import {
  logout,
  signIn,
  type SignInMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { rejectUnauthorizedAdminSession } from "@/lib/admin-session-authorization";
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
    if (session.outcome !== "authenticated") {
      return NextResponse.json(
        {
          code: "two_factor_required",
          detail:
            "Two-factor sign-in is not available in the admin portal yet.",
          status: 409,
          title: "Two-factor authentication required",
        },
        { status: 409 },
      );
    }
    const rejection = await rejectUnauthorizedAdminSession(client, session);
    if (rejection) {
      return rejection;
    }
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
