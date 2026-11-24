import type {
  PasskeyResponse,
  TwoFactorStatusResponse,
} from "@template/api-client/authentication";
import type { StatusTone } from "@template/ui-core";

export type OverviewStatus =
  { state: "loading" } | { state: "ready"; label: string; tone: StatusTone };

type QueryState<TData> = Readonly<{
  data?: TData;
  isError: boolean;
  isPending: boolean;
}>;

const UNAVAILABLE: OverviewStatus = {
  label: "Unavailable",
  state: "ready",
  tone: "neutral",
};

/**
 * Every account has a password set by default, so the backend exposes no
 * password flag. Passkey and two-factor statuses come from their own queries.
 */
export const PASSWORD_OVERVIEW_STATUS: OverviewStatus = {
  label: "Set",
  state: "ready",
  tone: "success",
};

export function passkeyOverviewStatus(
  query: QueryState<readonly PasskeyResponse[]>,
): OverviewStatus {
  if (query.isPending) return { state: "loading" };
  if (query.isError || !query.data) return UNAVAILABLE;
  const count = query.data.length;
  if (count === 0) return { label: "Not set", state: "ready", tone: "neutral" };
  return {
    label: count === 1 ? "1 passkey" : `${count} passkeys`,
    state: "ready",
    tone: "success",
  };
}

export function twoFactorOverviewStatus(
  query: QueryState<TwoFactorStatusResponse>,
): OverviewStatus {
  if (query.isPending) return { state: "loading" };
  if (query.isError || !query.data) return UNAVAILABLE;
  return query.data.enabled
    ? { label: "Enabled", state: "ready", tone: "success" }
    : { label: "Disabled", state: "ready", tone: "neutral" };
}
