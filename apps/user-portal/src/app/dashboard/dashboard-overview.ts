import type {
  ActiveSessionResponse,
  PasskeyResponse,
  TwoFactorStatusResponse,
} from "@template/api-client/authentication";
import type {
  BillingHistoryItemResponse,
  GetCurrentSubscriptionQueryResponse,
} from "@template/api-client/subscriptions";
import { formatMinorUnits, type BadgeTone } from "@template/ui-core";
import {
  describePaymentStatus,
  describeSubscription,
  formatBillingDate,
} from "@/lib/billing-display";
import { resolveBillingView } from "@/lib/billing-view";

/*
 * Overview dashboard decisions (USR-DASHBOARD). Every value comes from an
 * existing query that the portal already uses on Billing and Security; no
 * value is derived from the reference sample data. A query that is still
 * loading is "loading"; a failed query is "unavailable" — never replaced by
 * a default or a fixture.
 */

export type QueryState<TData> = Readonly<{
  data?: TData | undefined;
  error?: unknown;
  isError: boolean;
  isPending: boolean;
}>;

export type MetricSummary =
  | Readonly<{ state: "loading" }>
  | Readonly<{ detail: string; state: "unavailable" }>
  | Readonly<{ detail: string; state: "ready"; value: string }>;

/* ------------------------------------------------------------------------ */
/* Current plan                                                              */
/* ------------------------------------------------------------------------ */

/** Current plan tile from `GET /subscriptions/current` (404 → no plan). */
export function summarizePlan(
  current: QueryState<GetCurrentSubscriptionQueryResponse | null>,
): MetricSummary {
  const view = resolveBillingView(current);
  switch (view.kind) {
    case "loading":
      return { state: "loading" };
    case "error":
      return {
        detail: "Plan details could not be loaded.",
        state: "unavailable",
      };
    case "discovery":
      return {
        detail: "Choose a plan in Billing.",
        state: "ready",
        value: "No plan",
      };
    case "pending":
      return {
        detail: "Awaiting payment confirmation.",
        state: "ready",
        value: view.subscription.planName,
      };
    case "subscription":
      return {
        detail: planDetail(view.subscription),
        state: "ready",
        value: view.subscription.planName,
      };
  }
}

/** Uses only backend dates, as the Billing page does. */
function planDetail(subscription: GetCurrentSubscriptionQueryResponse) {
  const presentation = describeSubscription(subscription);
  if (subscription.cancelAtPeriodEnd) {
    const end = formatBillingDate(
      subscription.cancellationEffectiveAtUtc ??
        subscription.currentPeriodEndUtc,
    );
    return end ? `Ends ${end}` : presentation.label;
  }
  if (subscription.lifecycleStatus === "Active" && subscription.autoRenew) {
    const renews = formatBillingDate(subscription.nextBillingAtUtc);
    if (renews) return `Renews ${renews}`;
  }
  return presentation.label;
}

/* ------------------------------------------------------------------------ */
/* Security                                                                  */
/* ------------------------------------------------------------------------ */

export type ChecklistStatus = "done" | "todo" | "loading" | "unavailable";

export type ChecklistItem = Readonly<{
  description: string;
  id: "two-factor" | "passkey" | "backup-passkey";
  status: ChecklistStatus;
  title: string;
}>;

type SecurityQueries = Readonly<{
  passkeys: QueryState<readonly PasskeyResponse[]>;
  twoFactor: QueryState<TwoFactorStatusResponse>;
}>;

function queryStatus<TData>(
  query: QueryState<TData>,
): "loading" | "unavailable" | TData {
  if (query.isPending) return "loading";
  if (query.isError || query.data === undefined) return "unavailable";
  return query.data;
}

const UNAVAILABLE_DETAIL = "Status could not be loaded.";

/**
 * Recommended sign-in protections that the backend reports: two-factor
 * authentication (`getTwoFactorStatus`) and passkeys (`listPasskeys`), with
 * a second passkey as the backup. The password is not scored: the backend
 * exposes no password status or strength (DR-053).
 */
export function securityChecklist({
  passkeys,
  twoFactor,
}: SecurityQueries): readonly ChecklistItem[] {
  const twoFactorData = queryStatus(twoFactor);
  const passkeyData = queryStatus(passkeys);

  const twoFactorItem: ChecklistItem =
    typeof twoFactorData === "string"
      ? {
          description:
            twoFactorData === "loading"
              ? "Checking status…"
              : UNAVAILABLE_DETAIL,
          id: "two-factor",
          status: twoFactorData,
          title: "Two-factor authentication",
        }
      : twoFactorData.enabled
        ? {
            description: `Authenticator app · ${pluralize(twoFactorData.recoveryCodesRemaining, "recovery code")} left`,
            id: "two-factor",
            status: "done",
            title: "Two-factor authentication",
          }
        : {
            description: "Add a second step when you sign in.",
            id: "two-factor",
            status: "todo",
            title: "Two-factor authentication",
          };

  if (typeof passkeyData === "string") {
    const description =
      passkeyData === "loading" ? "Checking status…" : UNAVAILABLE_DETAIL;
    return [
      twoFactorItem,
      { description, id: "passkey", status: passkeyData, title: "Passkey" },
      {
        description,
        id: "backup-passkey",
        status: passkeyData,
        title: "Backup passkey",
      },
    ];
  }

  const count = passkeyData.length;
  return [
    twoFactorItem,
    count > 0
      ? {
          description: `${pluralize(count, "passkey")} registered`,
          id: "passkey",
          status: "done",
          title: "Passkey",
        }
      : {
          description: "Sign in with your fingerprint, face or screen lock.",
          id: "passkey",
          status: "todo",
          title: "Passkey",
        },
    count > 1
      ? {
          description: "You can still sign in if you lose a device.",
          id: "backup-passkey",
          status: "done",
          title: "Backup passkey",
        }
      : {
          description: "Add one on another device in case you lose this one.",
          id: "backup-passkey",
          status: "todo",
          title: "Backup passkey",
        },
  ];
}

const nextStepLabels: Record<ChecklistItem["id"], string> = {
  "backup-passkey": "Add a backup passkey",
  passkey: "Add a passkey",
  "two-factor": "Turn on two-factor authentication",
};

/** "N of 3" from the checklist; never shown until every status is known. */
export function summarizeSecurity(
  items: readonly ChecklistItem[],
): MetricSummary {
  if (items.some((item) => item.status === "loading")) {
    return { state: "loading" };
  }
  if (items.some((item) => item.status === "unavailable")) {
    return {
      detail: "Security status could not be loaded.",
      state: "unavailable",
    };
  }
  const done = items.filter((item) => item.status === "done").length;
  const next = items.find((item) => item.status === "todo");
  return {
    detail: next ? nextStepLabels[next.id] : "All recommended steps done",
    state: "ready",
    value: `${done} of ${items.length}`,
  };
}

/** Active sessions tile from `listActiveSessions` (`isCurrent` marks this device). */
export function summarizeSessions(
  sessions: QueryState<readonly ActiveSessionResponse[]>,
): MetricSummary {
  const data = queryStatus(sessions);
  if (data === "loading") return { state: "loading" };
  if (data === "unavailable") {
    return { detail: "Sessions could not be loaded.", state: "unavailable" };
  }
  const count = data.length;
  const includesCurrent = data.some((session) => session.isCurrent);
  const others = includesCurrent ? count - 1 : count;
  let detail: string;
  if (!includesCurrent) {
    detail = `${pluralize(count, "signed-in device")}`;
  } else if (others === 0) {
    detail = "This device only";
  } else {
    detail = `This device + ${others} other${others === 1 ? "" : "s"}`;
  }
  return { detail, state: "ready", value: String(count) };
}

/* ------------------------------------------------------------------------ */
/* Recent activity                                                           */
/* ------------------------------------------------------------------------ */

export type ActivityRow = Readonly<{
  amount: string;
  date: string;
  description: string;
  id: string;
  status: Readonly<{ label: string; tone: BadgeTone }>;
}>;

export const RECENT_ACTIVITY_LIMIT = 5;

/**
 * Billing history rows only (DR-050): there is no unified activity feed and
 * no wallet transactions, so nothing else is mixed in.
 */
export function billingActivityRows(
  items: readonly BillingHistoryItemResponse[],
  limit = RECENT_ACTIVITY_LIMIT,
): readonly ActivityRow[] {
  return items.slice(0, limit).map((item) => ({
    amount: formatMinorUnits(item.amount, item.currencyCode),
    date: formatBillingDate(item.paidAtUtc ?? item.createdAtUtc) ?? "—",
    description: [item.planName, item.paymentProviderName]
      .filter(Boolean)
      .join(" · "),
    id: item.paymentTransactionId,
    status: describePaymentStatus(item.paymentStatus),
  }));
}

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Greeting name: the first name, falling back to the display name. */
export function greetingName(
  profile: Readonly<{ firstName: string }>,
  displayName: string,
) {
  return profile.firstName.trim() || displayName;
}
