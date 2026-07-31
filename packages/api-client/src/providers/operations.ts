import type {
  SetActiveProviderMutationRequest,
  SetActiveProviderMutationResponse,
} from "../contracts/providers";
import { providersOperations } from "../contracts/providers";
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
