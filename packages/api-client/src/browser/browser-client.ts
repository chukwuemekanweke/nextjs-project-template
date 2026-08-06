import {
  createApiClient,
  type ApiClient,
  type ApiClientOptions,
} from "../api-client";

export type BrowserApiClientConfiguration = Omit<
  ApiClientOptions,
  "getAccessToken"
>;

export function createBrowserApiClient(
  configuration: BrowserApiClientConfiguration,
): ApiClient {
  return createApiClient(configuration);
}
