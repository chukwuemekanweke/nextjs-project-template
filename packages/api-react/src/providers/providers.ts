"use client";

import type { ProvidersClient } from "@template/api-client/providers";
import {
  mutationOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";

export const providerKeys = { all: ["providers"] as const };
export const setActiveProviderMutationOptions = (
  client: ProvidersClient,
  queryClient?: QueryClient,
) =>
  mutationOptions({
    mutationKey: [...providerKeys.all, "set-active"],
    mutationFn: (
      request: Parameters<ProvidersClient["setActiveProvider"]>[0],
    ) => client.setActiveProvider(request),
    onSuccess: () =>
      queryClient?.invalidateQueries({ queryKey: providerKeys.all }),
  });
export function useSetActiveProvider() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation(
    setActiveProviderMutationOptions(api.providers, queryClient),
  );
}
