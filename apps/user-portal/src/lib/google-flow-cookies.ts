import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  expiredGoogleFlowCookie,
  GOOGLE_AUTH_FLOW_COOKIE,
  googleFlowCookie,
} from "./google-flow-cookie-policy";

export { GOOGLE_AUTH_FLOW_COOKIE };

export async function getGoogleFlowToken(): Promise<string | undefined> {
  return (await cookies()).get(GOOGLE_AUTH_FLOW_COOKIE)?.value;
}

export function setGoogleFlowCookie(
  response: NextResponse,
  flowToken: string,
  expiresAtUtc: string,
): void {
  response.cookies.set(
    GOOGLE_AUTH_FLOW_COOKIE,
    flowToken,
    googleFlowCookie(expiresAtUtc),
  );
}

export function clearGoogleFlowCookie(response: NextResponse): void {
  response.cookies.set(GOOGLE_AUTH_FLOW_COOKIE, "", expiredGoogleFlowCookie);
}
