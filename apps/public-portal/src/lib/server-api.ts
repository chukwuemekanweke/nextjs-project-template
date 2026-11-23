import "server-only";

import { TENANT_ID_HEADER } from "@template/api-client";
import { createServerApiClient } from "@template/api-client/server";
import { serverEnv } from "@/config/server-env";

/** Anonymous server client for public data rendered by Server Components. */
export function createPublicServerApiClient() {
  return createServerApiClient({
    baseUrl: serverEnv.API_BASE_URL,
    defaultHeaders: { [TENANT_ID_HEADER]: serverEnv.TENANT_ID },
  });
}
