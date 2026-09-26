import { isApiError } from "@template/api-client";
import {
  completeTwoFactorChallenge,
  type TwoFactorProofRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";
import { setSessionCookies } from "@/lib/session-cookies";
import {
  clearTwoFactorChallengeCookie,
  getTwoFactorChallengeCookie,
} from "@/lib/two-factor-challenge-cookies";
import {
  isTerminalTwoFactorChallengeCode,
  safeSessionResponse,
} from "@/lib/two-factor-bff";

function missingChallengeResponse() {
  const response = NextResponse.json(
    {
      code: "two_factor_challenge_invalid",
      status: 400,
      title: "Invalid two-factor challenge",
    },
    { status: 400 },
  );
  clearTwoFactorChallengeCookie(response);
  return response;
}

export async function GET() {
  const challenge = await getTwoFactorChallengeCookie();
  if (
    !challenge ||
    !Number.isFinite(Date.parse(challenge.expiresAtUtc)) ||
    Date.parse(challenge.expiresAtUtc) <= Date.now()
  ) {
    return missingChallengeResponse();
  }
  return NextResponse.json({
    expiresAtUtc: challenge.expiresAtUtc,
    status: "two_factor_required",
  });
}

export async function POST(request: Request) {
  const challenge = await getTwoFactorChallengeCookie();
  if (!challenge) {
    return missingChallengeResponse();
  }

  try {
    const body = (await request.json()) as TwoFactorProofRequest;
    const client = await createAppServerApiClient({ authenticated: false });
    const session = await completeTwoFactorChallenge(client, {
      challenge: challenge.challenge,
      code: body.code,
      verificationMethod: body.verificationMethod,
    });
    const response = NextResponse.json(safeSessionResponse(session));
    setSessionCookies(response, session);
    clearTwoFactorChallengeCookie(response);
    return response;
  } catch (error) {
    const response = apiRouteError(error);
    if (
      isApiError(error) &&
      (isTerminalTwoFactorChallengeCode(error.code) || error.status === 410)
    ) {
      clearTwoFactorChallengeCookie(response);
    }
    return response;
  }
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  clearTwoFactorChallengeCookie(response);
  return response;
}
