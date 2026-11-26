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

export type SecurityStepId =
  "password" | "two-factor" | "passkey" | "backup-passkey";

export type SecurityStep = Readonly<{
  done: boolean;
  id: SecurityStepId;
  label: string;
}>;

export type SecurityLevelTone = "success" | "brand" | "warning";

export type SecurityScore =
  | { state: "loading" }
  | { state: "unavailable" }
  | {
      completed: number;
      level: string;
      state: "ready";
      steps: readonly SecurityStep[];
      tone: SecurityLevelTone;
      total: number;
    };

/**
 * Protection score from backend facts only: the account password (always
 * set), authenticator two-factor status and the registered passkey count
 * (one, then a backup). Password age and strength are not exposed by the
 * backend, so they are never scored or claimed (DR-053). While either query
 * loads the score is pending; if either fails it is unavailable rather than
 * guessed.
 */
export function securityScore(
  passkeys: QueryState<readonly PasskeyResponse[]>,
  twoFactor: QueryState<TwoFactorStatusResponse>,
): SecurityScore {
  if (passkeys.isPending || twoFactor.isPending) return { state: "loading" };
  if (
    passkeys.isError ||
    twoFactor.isError ||
    !passkeys.data ||
    !twoFactor.data
  )
    return { state: "unavailable" };

  const passkeyCount = passkeys.data.length;
  const twoFactorEnabled = twoFactor.data.enabled;
  const steps: SecurityStep[] = [
    { done: true, id: "password", label: "Password set" },
    {
      done: twoFactorEnabled,
      id: "two-factor",
      label: twoFactorEnabled
        ? "Two-factor authentication on"
        : "Turn on two-factor authentication",
    },
    {
      done: passkeyCount >= 1,
      id: "passkey",
      label:
        passkeyCount === 0
          ? "Add a passkey"
          : passkeyCount === 1
            ? "One passkey registered"
            : `${passkeyCount} passkeys registered`,
    },
    {
      done: passkeyCount >= 2,
      id: "backup-passkey",
      label:
        passkeyCount >= 2
          ? "Backup passkey registered"
          : "Add a backup passkey",
    },
  ];
  const completed = steps.filter((step) => step.done).length;
  const total = steps.length;

  if (completed === total) {
    return {
      completed,
      level: "Strong protection",
      state: "ready",
      steps,
      tone: "success",
      total,
    };
  }
  if (completed === total - 1) {
    return {
      completed,
      level: "Good protection",
      state: "ready",
      steps,
      tone: "brand",
      total,
    };
  }
  return {
    completed,
    level: completed <= 1 ? "Basic protection" : "Fair protection",
    state: "ready",
    steps,
    tone: "warning",
    total,
  };
}
