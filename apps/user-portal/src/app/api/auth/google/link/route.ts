import { isApiError } from "@template/api-client";
import { linkGoogleAccount } from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { apiRouteError } from "@/lib/api-route-error";
import {
  isTerminalGoogleFlowCode,
  safeGoogleSessionResponse,
} from "@/lib/google-bff";
import {
  clearGoogleFlowCookie,
  getGoogleFlowToken,
} from "@/lib/google-flow-cookies";
import { createAppServerApiClient } from "@/lib/server-api";
import { setSessionCookies } from "@/lib/session-cookies";

export async function POST(request: Request) {
  const flowToken = await getGoogleFlowToken();
  if (!flowToken) {
    return NextResponse.json(
      { code: "google_flow_invalid", status: 400 },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    const client = await createAppServerApiClient({ authenticated: false });
    const session = await linkGoogleAccount(client, {
      flowToken,
      password: typeof body.password === "string" ? body.password : "",
    });
    const response = NextResponse.json(safeGoogleSessionResponse(session));
    setSessionCookies(response, session);
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
