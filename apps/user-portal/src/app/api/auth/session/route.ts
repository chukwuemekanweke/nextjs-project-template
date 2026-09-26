import {
  logout,
  signIn,
  type SignInMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";
import { clearSessionCookies, setSessionCookies } from "@/lib/session-cookies";
import {
  clearTwoFactorChallengeCookie,
  setTwoFactorChallengeCookie,
} from "@/lib/two-factor-challenge-cookies";
import {
  isAuthenticatedSessionResponse,
  safeSessionResponse,
  safeTwoFactorRequiredResponse,
} from "@/lib/two-factor-bff";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await signIn(
      client,
      (await request.json()) as SignInMutationRequest,
    );
    if (!isAuthenticatedSessionResponse(result)) {
      const response = NextResponse.json(safeTwoFactorRequiredResponse(result));
      clearSessionCookies(response);
      setTwoFactorChallengeCookie(
        response,
        result.challenge,
        result.challengeExpiresAtUtc,
      );
      return response;
    }

    const response = NextResponse.json(safeSessionResponse(result));
    setSessionCookies(response, result);
    clearTwoFactorChallengeCookie(response);
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
  clearTwoFactorChallengeCookie(response);
  return response;
}
