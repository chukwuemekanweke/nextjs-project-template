import { TENANT_ID_HEADER } from "@template/api-client";
import { createBrowserApiClient } from "@template/api-client/browser";
import { env } from "@/config/env";

/** Browser-safe client for approved public or same-origin API calls. */
export const browserApi = createBrowserApiClient({
  baseUrl: env.apiBaseUrl,
  defaultHeaders: { [TENANT_ID_HEADER]: env.tenantId },
});
export { sessionFetch as authenticatedFetch } from "./session-fetch";
