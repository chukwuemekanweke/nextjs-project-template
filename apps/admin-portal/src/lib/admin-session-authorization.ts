import "server-only";

import type { ApiTransport } from "@template/api-client";
import {
  logout,
  type SignInMutationResponse,
} from "@template/api-client/authentication";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/server-env";
import { hasRequiredAdminRole } from "./admin-authorization";
import { clearSessionCookies } from "./session-cookies";

export async function rejectUnauthorizedAdminSession(
  client: ApiTransport,
  session: SignInMutationResponse,
): Promise<NextResponse | undefined> {
  if (
    hasRequiredAdminRole(session.accessToken, serverEnv.ADMIN_REQUIRED_ROLE)
  ) {
    return undefined;
  }

  try {
    await logout(client, {
      headers: { authorization: `Bearer ${session.accessToken}` },
    });
  } catch {
    // The rejected session is never persisted or returned to the browser.
  }

  const response = NextResponse.json(
    {
      detail: "This account is not authorized to use the admin portal.",
      status: 403,
      title: "Admin access required",
    },
    { status: 403 },
  );
  clearSessionCookies(response);
  return response;
}
