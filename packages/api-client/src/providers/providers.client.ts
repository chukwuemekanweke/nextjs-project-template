import type { ApiOperationOptions, ApiTransport } from "../client";
import type { SetActiveProviderMutationRequest } from "./contracts";
import { setActiveProvider } from "./operations";

export interface ProvidersClient {
  setActiveProvider(
    request: SetActiveProviderMutationRequest,
    options?: ApiOperationOptions,
  ): Promise<void>;
}

export function createProvidersClient(
  transport: ApiTransport,
): ProvidersClient {
  return {
    setActiveProvider: (request, options) =>
      setActiveProvider(transport, request, options),
  };
}
