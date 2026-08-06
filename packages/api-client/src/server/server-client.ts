import "server-only";

import {
  createApiClient,
  type ApiClient,
  type ApiClientOptions,
} from "../api-client";

export type ServerApiClientConfiguration = ApiClientOptions;

export function createServerApiClient(
  configuration: ServerApiClientConfiguration,
): ApiClient {
  return createApiClient(configuration);
}
