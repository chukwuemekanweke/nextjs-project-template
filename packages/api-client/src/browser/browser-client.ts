import { createApiClient } from "../client/request";
import type { ApiClient, ApiClientConfiguration } from "../client/types";

export type BrowserApiClientConfiguration = Omit<
  ApiClientConfiguration,
  "getAccessToken"
>;

export function createBrowserApiClient(
  configuration: BrowserApiClientConfiguration,
): ApiClient {
  return createApiClient(configuration);
}
