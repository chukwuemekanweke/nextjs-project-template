import type { AuthenticationClient } from "@template/api-client/authentication";
import { authenticationOperations } from "@template/api-client/authentication";
import { getInfiniteQueryOptions } from "../query-client/get-infinite-query-options";
import { getQueryOptions } from "../query-client/get-query-options";
import { authenticationKeys } from "./authentication.keys";

export const twoFactorStatusQueryOptions = (client: AuthenticationClient) =>
  getQueryOptions(authenticationOperations.getTwoFactorStatus, {
    queryKey: authenticationKeys.twoFactorStatus(),
    queryFn: ({ signal }) => client.getTwoFactorStatus({ signal }),
  });

export const activeSessionsQueryOptions = (client: AuthenticationClient) =>
  getQueryOptions(authenticationOperations.listActiveSessions, {
    queryKey: authenticationKeys.sessions(),
    queryFn: ({ signal }) => client.listActiveSessions({ signal }),
  });

export const loginActivityQueryOptions = (
  client: AuthenticationClient,
  limit?: number,
) =>
  getInfiniteQueryOptions(authenticationOperations.getLoginActivity, {
    queryKey: authenticationKeys.loginActivityList({ Limit: limit }),
    queryFn: ({ pageParam, signal }) =>
      client.getLoginActivity({ Cursor: pageParam, Limit: limit }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
