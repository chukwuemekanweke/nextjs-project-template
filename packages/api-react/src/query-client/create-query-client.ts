import { ApiError } from "@template/api-client";
import { QueryClient } from "@tanstack/react-query";

export const queryClientDefaults = {
  gcTime: 5 * 60_000,
  staleTime: 30_000,
} as const;

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false;
  }
  if (error instanceof ApiError) {
    return !error.isCancelled && !(error.status && error.status < 500);
  }
  return true;
}

export function queryRetryDelay(attemptIndex: number) {
  return Math.min(1_000 * 2 ** attemptIndex, 30_000);
}

export function createApiQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        ...queryClientDefaults,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay: queryRetryDelay,
      },
    },
  });
}
