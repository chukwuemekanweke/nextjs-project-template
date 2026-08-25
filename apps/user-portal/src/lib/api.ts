import { env } from "@/config/env";
import { createUserPortalBrowserApi } from "./browser-api";
import { sessionFetch } from "./session-fetch";

/** Browser-safe client for approved public or same-origin API calls. */
export const browserApi = createUserPortalBrowserApi({
  apiBaseUrl: env.apiBaseUrl,
  fetch: sessionFetch,
  tenantId: env.tenantId,
});
export { sessionFetch as authenticatedFetch };
