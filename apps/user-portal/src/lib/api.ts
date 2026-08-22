import { env } from "@/config/env";
import { createUserPortalBrowserApi } from "./browser-api";

/** Browser-safe client for approved public or same-origin API calls. */
export const browserApi = createUserPortalBrowserApi({
  apiBaseUrl: env.apiBaseUrl,
  tenantId: env.tenantId,
});
export { sessionFetch as authenticatedFetch } from "./session-fetch";
