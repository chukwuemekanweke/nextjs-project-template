import { signInWithGoogle } from "@template/api-client/authentication";
import { isApiError } from "@template/api-client";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import {
  isAuthenticatedGoogleResponse,
  isTerminalGoogleFlowCode,
  safeGoogleSessionResponse,
} from "@/lib/google-bff";
import {
  clearGoogleFlowCookie,
  getGoogleFlowToken,
} from "@/lib/google-flow-cookies";
import { createAppServerApiClient } from "@/lib/server-api";
import { clearSessionCookies, setSessionCookies } from "@/lib/session-cookies";
import {
  clearTwoFactorChallengeCookie,
  setTwoFactorChallengeCookie,
} from "@/lib/two-factor-challenge-cookies";
import {
  isTwoFactorRequiredResponse,
  safeTwoFactorRequiredResponse,
} from "@/lib/two-factor-bff";

export async function POST(request: Request) {
  const flowToken = await getGoogleFlowToken();
  if (!flowToken) {
    return NextResponse.json(
      {
        code: "google_flow_invalid",
        status: 400,
        title: "Invalid Google flow",
      },
      { status: 400 },
    );
  }

  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const body = (await request.json()) as { credential?: unknown };
    const result = await signInWithGoogle(client, {
      flowToken,
      idToken: typeof body.credential === "string" ? body.credential : "",
    });
    if (isTwoFactorRequiredResponse(result)) {
      const response = NextResponse.json(safeTwoFactorRequiredResponse(result));
      clearSessionCookies(response);
      setTwoFactorChallengeCookie(
        response,
        result.challenge,
        result.challengeExpiresAtUtc,
      );
      clearGoogleFlowCookie(response);
      return response;
    }
    if (!isAuthenticatedGoogleResponse(result)) {
      return NextResponse.json({ status: result.outcome });
    }

    const response = NextResponse.json(safeGoogleSessionResponse(result));
    setSessionCookies(response, result);
    clearTwoFactorChallengeCookie(response);
    clearGoogleFlowCookie(response);
    return response;
  } catch (error) {
    const response = apiRouteError(error);
    if (isApiError(error) && isTerminalGoogleFlowCode(error.code)) {
      clearGoogleFlowCookie(response);
    }
    return response;
  }
}
