import { createBrowserApiClient } from "@template/api-client/browser";
import { env } from "@/config/env";

/** Browser-safe client for approved public calls after CORS or same-origin routing is configured. */
export const browserApi = createBrowserApiClient({ baseUrl: env.apiBaseUrl });
