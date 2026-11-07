import {
  completePasskeyAuthentication,
  type AuthenticationResponseJson,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import {
  isAuthenticatedPasskeyResponse,
  isJsonObject,
  NO_STORE_HEADERS,
  passkeySessionTokens,
} from "@/lib/passkey-bff";
import {
  clearPasskeySignInFlowCookie,
  getPasskeySignInFlowToken,
} from "@/lib/passkey-flow-cookies";
import { createAppServerApiClient } from "@/lib/server-api";
import { clearSessionCookies, setSessionCookies } from "@/lib/session-cookies";
import {
  clearTwoFactorChallengeCookie,
  setTwoFactorChallengeCookie,
} from "@/lib/two-factor-challenge-cookies";
import {
  safeSessionResponse,
  safeTwoFactorRequiredResponse,
} from "@/lib/two-factor-bff";

function failure(status: number, title: string) {
  const response = NextResponse.json(
    { status, title },
    { headers: NO_STORE_HEADERS, status },
  );
  clearPasskeySignInFlowCookie(response);
  return response;
}

async function readCredential(request: Request): Promise<unknown> {
  try {
    return ((await request.json()) as { credential?: unknown }).credential;
  } catch {
    return undefined;
  }
}

/**
 * Completes passkey sign-in. The backend consumes the flow on every attempt,
 * so the flow cookie is always cleared; only an `authenticated` outcome sets
 * the normal session cookies.
 */
export async function POST(request: Request) {
  const flowToken = await getPasskeySignInFlowToken();
  if (!flowToken) {
    return failure(400, "Invalid passkey sign-in flow");
  }
  const credential = await readCredential(request);
  if (!isJsonObject(credential)) {
    return failure(400, "Invalid passkey credential");
  }

  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const result = await completePasskeyAuthentication(client, {
      credential: credential as AuthenticationResponseJson,
      flowToken,
    });
    if (!isAuthenticatedPasskeyResponse(result)) {
      const response = NextResponse.json(
        safeTwoFactorRequiredResponse(result),
        { headers: NO_STORE_HEADERS },
      );
      clearSessionCookies(response);
      setTwoFactorChallengeCookie(
        response,
        result.challenge,
        result.challengeExpiresAtUtc,
      );
      clearPasskeySignInFlowCookie(response);
      return response;
    }

    const session = passkeySessionTokens(result);
    const response = NextResponse.json(
      safeSessionResponse({ ...session, outcome: "authenticated" }),
      { headers: NO_STORE_HEADERS },
    );
    setSessionCookies(response, session);
    clearTwoFactorChallengeCookie(response);
    clearPasskeySignInFlowCookie(response);
    return response;
  } catch (error) {
    const response = apiRouteError(error);
    response.headers.set("cache-control", "no-store");
    clearPasskeySignInFlowCookie(response);
    return response;
  }
}

/** Abandons a started passkey sign-in, for example after cancellation. */
export function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  clearPasskeySignInFlowCookie(response);
  return response;
}
