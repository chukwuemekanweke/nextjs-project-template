import type {
  GetCurrentKycVerificationQueryResponse,
  KycClient,
} from "@template/api-client/kyc";
import { kycOperations } from "@template/api-client/kyc";
import type { QueryState } from "@tanstack/react-query";
import { getQueryOptions } from "../query-client/get-query-options";
import { kycKeys } from "./kyc.keys";

export type KycPollingPolicy = Readonly<{
  intervalMs: number;
  maxPolls: number;
}>;

/** About two minutes before the page falls back to manual refresh. */
export const defaultKycPollingPolicy: KycPollingPolicy = Object.freeze({
  intervalMs: 3_000,
  maxPolls: 40,
});

type KycQueryState = Pick<
  QueryState<GetCurrentKycVerificationQueryResponse>,
  "data" | "dataUpdateCount" | "status"
>;

export function isTransientKycStatus(status: string | undefined): boolean {
  return status === "Pending" || status === "InProgress";
}

export function nextKycVerificationPoll(
  state: KycQueryState,
  policy: KycPollingPolicy = defaultKycPollingPolicy,
): number | false {
  if (state.status === "error" || !isTransientKycStatus(state.data?.status)) {
    return false;
  }
  return state.dataUpdateCount < policy.maxPolls ? policy.intervalMs : false;
}

export function isKycVerificationPollingExhausted(
  state: KycQueryState | undefined,
  policy: KycPollingPolicy = defaultKycPollingPolicy,
): boolean {
  return Boolean(
    isTransientKycStatus(state?.data?.status) &&
    (state?.dataUpdateCount ?? 0) >= policy.maxPolls,
  );
}

export const currentKycVerificationQueryOptions = (
  client: KycClient,
  policy: KycPollingPolicy = defaultKycPollingPolicy,
) =>
  getQueryOptions(kycOperations.getCurrentKycVerification, {
    queryKey: kycKeys.current(),
    queryFn: ({ signal }) => client.getCurrentKycVerification({ signal }),
    refetchInterval: (query) => nextKycVerificationPoll(query.state, policy),
    staleTime: 0,
  });
