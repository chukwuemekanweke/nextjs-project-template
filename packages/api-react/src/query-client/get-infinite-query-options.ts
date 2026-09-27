import {
  infiniteQueryOptions,
  type DefaultError,
  type InfiniteData,
  type QueryKey,
  type UndefinedInitialDataInfiniteOptions,
} from "@tanstack/react-query";

type GetOperation = Readonly<{ method: "GET"; path: string }>;

/**
 * Creates retryable infinite query options only for operations declared as
 * GET. The runtime check protects JavaScript consumers and unsafe type casts.
 */
export function getInfiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  operation: GetOperation,
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
) {
  if (operation.method !== "GET") {
    throw new Error(
      `TanStack Query retries are restricted to GET operations; received ${operation.method} ${operation.path}.`,
    );
  }
  return infiniteQueryOptions(options);
}
