import { QueryClient } from "@tanstack/react-query";

export function createApiQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
}
