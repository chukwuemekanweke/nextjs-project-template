import { startGoogleAuthenticationFlow } from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { setGoogleFlowCookie } from "@/lib/google-flow-cookies";
import { createAppServerApiClient } from "@/lib/server-api";

export async function POST() {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const flow = await startGoogleAuthenticationFlow(client);
    const response = NextResponse.json(
      { expiresAtUtc: flow.expiresAtUtc, nonce: flow.nonce },
      { status: 201 },
    );
    setGoogleFlowCookie(response, flow.flowToken, flow.expiresAtUtc);
    return response;
  } catch (error) {
    return apiRouteError(error);
  }
}
