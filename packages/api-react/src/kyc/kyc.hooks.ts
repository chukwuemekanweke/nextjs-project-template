"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import { startKycVerificationMutationOptions } from "./kyc.mutations";
import {
  currentKycVerificationQueryOptions,
  defaultKycPollingPolicy,
  isKycVerificationPollingExhausted,
  type KycPollingPolicy,
} from "./kyc.queries";

export function useCurrentKycVerification(
  policy: KycPollingPolicy = defaultKycPollingPolicy,
) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const options = currentKycVerificationQueryOptions(api.kyc, policy);
  const query = useQuery(options);
  return {
    ...query,
    pollingExhausted: isKycVerificationPollingExhausted(
      queryClient.getQueryState(options.queryKey),
      policy,
    ),
  };
}

export function useStartKycVerification() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(startKycVerificationMutationOptions(api.kyc, queryClient));
}
