import type { ApiOperationOptions, ApiTransport } from "../client";
import type {
  GetCurrentKycVerificationQueryResponse,
  StartKycVerificationMutationResponse,
} from "./contracts";
import { kycOperations } from "./contracts";

export const getCurrentKycVerification = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<GetCurrentKycVerificationQueryResponse>({
    ...kycOperations.getCurrentKycVerification,
    ...options,
  });

/** The backend resolves the stakeholder and accepts no request fields. */
export const startKycVerification = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<StartKycVerificationMutationResponse>({
    ...kycOperations.startKycVerification,
    ...options,
  });
