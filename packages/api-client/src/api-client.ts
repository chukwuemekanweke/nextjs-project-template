import {
  createAuthenticationClient,
  type AuthenticationClient,
} from "./authentication";
import { createFetchApiTransport } from "./transport/fetch-api-transport";
import type { ApiClientConfiguration, ApiTransport } from "./client/types";
import { createPaymentsClient, type PaymentsClient } from "./payments";
import { createProfilesClient, type ProfilesClient } from "./profiles";
import { createProvidersClient, type ProvidersClient } from "./providers";
import {
  createReferenceDataClient,
  type ReferenceDataClient,
} from "./reference-data";

export interface ApiClient extends ApiTransport {
  readonly authentication: AuthenticationClient;
  readonly payments: PaymentsClient;
  readonly profiles: ProfilesClient;
  readonly providers: ProvidersClient;
  readonly referenceData: ReferenceDataClient;
  readonly transport: ApiTransport;
}

export type ApiClientOptions = ApiClientConfiguration;

export function createApiClient(options: ApiClientOptions): ApiClient {
  return createApiClientWithTransport(createFetchApiTransport(options));
}

export function createApiClientWithTransport(
  transport: ApiTransport,
): ApiClient {
  return Object.assign(transport, {
    authentication: createAuthenticationClient(transport),
    payments: createPaymentsClient(transport),
    profiles: createProfilesClient(transport),
    providers: createProvidersClient(transport),
    referenceData: createReferenceDataClient(transport),
    transport,
  });
}
