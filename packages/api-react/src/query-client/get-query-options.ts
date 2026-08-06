import {
  queryOptions,
  type DefaultError,
  type QueryKey,
  type UndefinedInitialDataOptions,
} from "@tanstack/react-query";

type GetOperation = Readonly<{ method: "GET"; path: string }>;

/**
 * Creates retryable query options only for operations declared as GET.
 * The runtime check protects JavaScript consumers and unsafe type casts.
 */
export function getQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  operation: GetOperation,
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  if (operation.method !== "GET") {
    throw new Error(
      `TanStack Query retries are restricted to GET operations; received ${operation.method} ${operation.path}.`,
    );
  }
  return queryOptions(options);
}
