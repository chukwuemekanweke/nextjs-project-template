import type {
  SetActiveProviderMutationRequest,
  SetActiveProviderMutationResponse,
} from "./contracts";
import { providersOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

export const setActiveProvider = (
  client: ApiTransport,
  request: SetActiveProviderMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SetActiveProviderMutationResponse>({
    ...providersOperations.setActiveProvider,
    ...options,
    body: request,
  });
