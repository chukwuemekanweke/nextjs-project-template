import "server-only";

import { TENANT_ID_HEADER } from "@template/api-client";
import {
  createForwardedRequestHeaders,
  createServerApiClient,
} from "@template/api-client/server";
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
      [TENANT_ID_HEADER]: serverEnv.TENANT_ID,
      ...createForwardedRequestHeaders(requestHeaders),
    },
    getAccessToken:
      options.authenticated === false
        ? undefined
        : () => cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
  });
}
