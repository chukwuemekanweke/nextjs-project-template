import type { KycClient } from "@template/api-client/kyc";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { kycKeys } from "./kyc.keys";

export const startKycVerificationMutationOptions = (
  client: KycClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...kycKeys.all, "start"],
    mutationFn: () => client.startKycVerification(),
    // A failed or ambiguous start can still have changed provider state.
    onSettled: () =>
      queryClient?.invalidateQueries({ queryKey: kycKeys.current() }),
  });
