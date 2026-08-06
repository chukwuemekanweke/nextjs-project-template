import type {
  SetActiveProviderMutationRequest,
  SetActiveProviderMutationResponse,
} from "./contracts";
import { providersOperations } from "./contracts";
import type { ApiClient, ApiOperationOptions } from "../client";

export const setActiveProvider = (
  client: ApiClient,
  request: SetActiveProviderMutationRequest,
  options?: ApiOperationOptions,
) =>
  client.request<SetActiveProviderMutationResponse>({
    ...providersOperations.setActiveProvider,
    ...options,
    body: request,
  });
