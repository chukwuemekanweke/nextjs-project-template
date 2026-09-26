import type { AuthenticationClient } from "@template/api-client/authentication";
import { authenticationOperations } from "@template/api-client/authentication";
import { getQueryOptions } from "../query-client/get-query-options";
import { authenticationKeys } from "./authentication.keys";

export const twoFactorStatusQueryOptions = (client: AuthenticationClient) =>
  getQueryOptions(authenticationOperations.getTwoFactorStatus, {
    queryKey: authenticationKeys.twoFactorStatus(),
    queryFn: ({ signal }) => client.getTwoFactorStatus({ signal }),
  });
