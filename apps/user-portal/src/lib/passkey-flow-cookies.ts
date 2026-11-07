import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  expiredPasskeySignInFlowCookie,
  PASSKEY_SIGN_IN_FLOW_COOKIE,
  passkeySignInFlowCookie,
} from "./passkey-flow-cookie-policy";

export { PASSKEY_SIGN_IN_FLOW_COOKIE };

export async function getPasskeySignInFlowToken(): Promise<string | undefined> {
  return (await cookies()).get(PASSKEY_SIGN_IN_FLOW_COOKIE)?.value || undefined;
}

export function setPasskeySignInFlowCookie(
  response: NextResponse,
  flowToken: string,
  expiresAtUtc: string,
): void {
  response.cookies.set(
    PASSKEY_SIGN_IN_FLOW_COOKIE,
    flowToken,
    passkeySignInFlowCookie(expiresAtUtc),
  );
}

export function clearPasskeySignInFlowCookie(response: NextResponse): void {
  response.cookies.set(
    PASSKEY_SIGN_IN_FLOW_COOKIE,
    "",
    expiredPasskeySignInFlowCookie,
  );
}
