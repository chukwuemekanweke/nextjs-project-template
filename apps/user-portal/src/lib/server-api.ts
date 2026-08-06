import "server-only";

import { createServerApiClient } from "@template/api-client/server";
import { cookies, headers } from "next/headers";
import { serverEnv } from "@/config/server-env";
import { ACCESS_TOKEN_COOKIE } from "./session-cookies";

export async function createAppServerApiClient(
  options: { authenticated?: boolean } = {},
) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  return createServerApiClient({
    baseUrl: serverEnv.API_BASE_URL,
    defaultCache: options.authenticated === false ? undefined : "no-store",
    defaultHeaders: {
      ...(requestHeaders.get("traceparent")
        ? { traceparent: requestHeaders.get("traceparent")! }
        : {}),
      ...(requestHeaders.get("user-agent")
        ? { "user-agent": requestHeaders.get("user-agent")! }
        : {}),
      ...(requestHeaders.get("x-correlation-id")
        ? { "x-correlation-id": requestHeaders.get("x-correlation-id")! }
        : {}),
    },
    getAccessToken:
      options.authenticated === false
        ? undefined
        : () => cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
  });
}
