import {
  signInWithGoogle,
  type SignInWithGoogleMutationRequest,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { createAppServerApiClient } from "@/lib/server-api";
import { setSessionCookies } from "@/lib/session-cookies";

export async function POST(request: Request) {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const session = await signInWithGoogle(
      client,
      (await request.json()) as SignInWithGoogleMutationRequest,
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
