import "server-only";

import { createApiClient } from "../client/request";
import type { ApiClient, ApiClientConfiguration } from "../client/types";

export type ServerApiClientConfiguration = ApiClientConfiguration;

export function createServerApiClient(
  configuration: ServerApiClientConfiguration,
): ApiClient {
  return createApiClient(configuration);
}
