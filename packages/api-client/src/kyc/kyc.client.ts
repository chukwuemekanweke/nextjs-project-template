import type { ApiOperationOptions, ApiTransport } from "../client";
import type {
  GetCurrentKycVerificationQueryResponse,
  StartKycVerificationMutationResponse,
} from "./contracts";
import { getCurrentKycVerification, startKycVerification } from "./operations";

export interface KycClient {
  getCurrentKycVerification(
    options?: ApiOperationOptions,
  ): Promise<GetCurrentKycVerificationQueryResponse>;
  startKycVerification(
    options?: ApiOperationOptions,
  ): Promise<StartKycVerificationMutationResponse>;
}

export function createKycClient(transport: ApiTransport): KycClient {
  return {
    getCurrentKycVerification: (options) =>
      getCurrentKycVerification(transport, options),
    startKycVerification: (options) => startKycVerification(transport, options),
  };
}
