import type { PaymentsClient } from "@template/api-client/payments";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { paymentKeys } from "./payments.keys";

export const initiatePaymentMutationOptions = (
  client: PaymentsClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...paymentKeys.all, "initiate"],
    mutationFn: (request: Parameters<PaymentsClient["initiatePayment"]>[0]) =>
      client.initiatePayment(request),
    onSuccess: () =>
      queryClient?.invalidateQueries({
        queryKey: paymentKeys.walletTransactions(),
      }),
  });
export const setPaymentProviderActivationMutationOptions = (
  client: PaymentsClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...paymentKeys.all, "provider-activation"],
    mutationFn: ({
      path,
      request,
    }: {
      path: Parameters<PaymentsClient["setPaymentProviderActivation"]>[0];
      request: Parameters<PaymentsClient["setPaymentProviderActivation"]>[1];
    }) => client.setPaymentProviderActivation(path, request),
    onSuccess: () =>
      queryClient?.invalidateQueries({ queryKey: paymentKeys.all }),
  });
