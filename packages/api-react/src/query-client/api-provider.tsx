"use client";

import type { ApiClient } from "@template/api-client";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createContext, type ReactNode, useContext, useState } from "react";
import { createApiQueryClient } from "./create-query-client";

const ApiClientContext = createContext<ApiClient | undefined>(undefined);

export function ApiProvider({
  apiClient,
  children,
  queryClient,
}: {
  apiClient: ApiClient;
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  const [ownedQueryClient] = useState(createApiQueryClient);
  return (
    <ApiClientContext.Provider value={apiClient}>
      <QueryClientProvider client={queryClient ?? ownedQueryClient}>
        {children}
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </ApiClientContext.Provider>
  );
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error("useApiClient must be used within ApiProvider.");
  }
  return client;
}
