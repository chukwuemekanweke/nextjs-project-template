import { createPasskeyAuthenticationOptions } from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import { NO_STORE_HEADERS } from "@/lib/passkey-bff";
import { setPasskeySignInFlowCookie } from "@/lib/passkey-flow-cookies";
import { createAppServerApiClient } from "@/lib/server-api";

/**
 * Starts a discoverable passkey sign-in. The single-use flow token stays in an
 * HttpOnly cookie; the browser receives only the public WebAuthn options.
 */
export async function POST() {
  try {
    const client = await createAppServerApiClient({ authenticated: false });
    const flow = await createPasskeyAuthenticationOptions(client);
    const response = NextResponse.json(
      { expiresAtUtc: flow.expiresAtUtc, publicKey: flow.publicKey },
      { headers: NO_STORE_HEADERS },
    );
    setPasskeySignInFlowCookie(response, flow.flowToken, flow.expiresAtUtc);
    return response;
  } catch (error) {
    return apiRouteError(error);
  }
}
