import type { StepUpSubmission } from "@/components/admin-patterns";
import type { AdminKycStatus } from "@/features/admin-kyc/kyc-model";
import type {
  AdminBadge,
  AdminScreenBlocked,
  AdminSection,
} from "./admin-view";

/*
 * Admin user management view models (ADM-USERS, ADM-USER-DETAIL).
 *
 * There is no admin user API (DR-071, DR-072): nothing in production builds
 * these models, and every action is an intent the future adapter performs
 * through the backend. These are local presentation types, not API DTOs.
 * Admin access today is one configured role claim (`proxy.ts`); the
 * permission names in the reference (users.read, users.manage) are future
 * targets and are never evaluated here.
 */

export const ADMIN_ACCOUNT_STATUSES = ["active", "locked"] as const;
export type AdminAccountStatus =
  (typeof ADMIN_ACCOUNT_STATUSES)[number] | "unknown";

const accountBadges: Record<AdminAccountStatus, AdminBadge> = {
  active: { label: "Active", tone: "success" },
  locked: { label: "Locked", tone: "danger" },
  unknown: { label: "Unknown", tone: "neutral" },
};

export function accountStatusBadge(status: AdminAccountStatus): AdminBadge {
  return accountBadges[status];
}

/** A role reference as the backend names it (id + display name). */
export type AdminRoleRef = Readonly<{ id: string; name: string }>;

/** One row of the reference users table. */
export type AdminUserListItem = Readonly<{
  id: string;
  displayName: string;
  email: string;
  accountStatus: AdminAccountStatus;
  /** `undefined` = not reported by the source. */
  kycStatus?: AdminKycStatus;
  /** `null` = no plan; `undefined` = not reported. */
  planName?: string | null;
  roles: readonly AdminRoleRef[];
  /** `null` = never signed in; `undefined` = not reported. */
  lastLoginAt?: string | null;
}>;

export const ADMIN_USER_SORTS = [
  "newest",
  "oldest",
  "lastLogin",
  "name",
] as const;
export type AdminUserSort = (typeof ADMIN_USER_SORTS)[number];

export const adminUserSortLabels: Record<AdminUserSort, string> = {
  lastLogin: "Last login",
  name: "Name",
  newest: "Newest",
  oldest: "Oldest",
};

export type AdminUserFilters = Readonly<{
  query: string;
  status: AdminAccountStatus | "any";
  kyc: AdminKycStatus | "any";
  /** Role id from `roleOptions`, or "any". */
  role: string;
  /** Plan id from `planOptions`, or "any". */
  plan: string;
  sort: AdminUserSort;
}>;

export const DEFAULT_ADMIN_USER_FILTERS: AdminUserFilters = {
  kyc: "any",
  plan: "any",
  query: "",
  role: "any",
  sort: "newest",
  status: "any",
};

/** True when any filter narrows the list (sort does not). */
export function hasActiveUserFilters(filters: AdminUserFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.status !== "any" ||
    filters.kyc !== "any" ||
    filters.role !== "any" ||
    filters.plan !== "any"
  );
}

/**
 * Applies one control change. Returns `null` when nothing changed, so the
 * page does not refetch or reset paging for a no-op.
 */
export function nextUserFilters<Key extends keyof AdminUserFilters>(
  current: AdminUserFilters,
  key: Key,
  value: AdminUserFilters[Key],
): AdminUserFilters | null {
  if (current[key] === value) return null;
  return { ...current, [key]: value };
}

export type AdminUsersListModel =
  | AdminScreenBlocked
  | Readonly<{
      state: "ready";
      users: readonly AdminUserListItem[];
      page: number;
      pageSize: number;
      /** Omitted when the source does not report a total. */
      totalItems?: number;
      totalPages: number;
    }>;

/* ------------------------------------------------------------------------ */
/* Detail                                                                    */
/* ------------------------------------------------------------------------ */

export type AdminUserAccount = Readonly<{
  fullName?: string;
  country?: string;
  language?: string;
  createdAt?: string;
  /** `null` = never signed in. */
  lastLoginAt?: string | null;
  lastActiveAt?: string;
  signInMethods?: readonly string[];
  /** `undefined` = not reported (never shown as "Disabled"). */
  twoFactorEnabled?: boolean;
}>;

export type AdminUserDetail = Readonly<{
  id: string;
  displayName: string;
  email: string;
  /** `undefined` = not reported; no badge is shown. */
  emailConfirmed?: boolean;
  accountStatus: AdminAccountStatus;
  tenantName?: string;
  account: AdminUserAccount;
  roles: readonly AdminRoleRef[];
}>;

export type AdminUserKycSummary = Readonly<{
  verificationId?: string;
  status: AdminKycStatus;
  attemptNumber?: number;
  startedAt?: string;
}>;

export const ADMIN_SUBSCRIPTION_STATUSES = [
  "active",
  "cancelling",
  "cancelled",
  "pastDue",
] as const;
export type AdminUserSubscriptionStatus =
  (typeof ADMIN_SUBSCRIPTION_STATUSES)[number] | "unknown";

const subscriptionBadges: Record<AdminUserSubscriptionStatus, AdminBadge> = {
  active: { label: "Active", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  cancelling: { label: "Cancels at period end", tone: "warning" },
  pastDue: { label: "Past due", tone: "danger" },
  unknown: { label: "Unknown", tone: "neutral" },
};

export function subscriptionStatusBadge(
  status: AdminUserSubscriptionStatus,
): AdminBadge {
  return subscriptionBadges[status];
}

export type AdminUserSubscriptionSummary = Readonly<{
  planName: string;
  /** Display interval, for example "monthly". */
  interval?: string;
  status: AdminUserSubscriptionStatus;
  renewsAt?: string;
  autoRenew?: boolean;
}>;

export type AdminUserSession = Readonly<{
  id: string;
  /** For example "Chrome on Windows". */
  label: string;
  location?: string;
  lastActiveAt?: string;
  current?: boolean;
}>;

export type AdminSecurityEvent = Readonly<{
  id: string;
  event: string;
  device?: string;
  location?: string;
  occurredAt?: string;
}>;

export type AdminUserDetailModel =
  | AdminScreenBlocked
  | Readonly<{ state: "notFound" }>
  | Readonly<{
      state: "ready";
      user: AdminUserDetail;
      /** Roles that may be assigned (backend-owned catalogue). */
      assignableRoles: AdminSection<readonly AdminRoleRef[]>;
      /** `null` data = the user has no verification. */
      kyc: AdminSection<AdminUserKycSummary | null>;
      /** `null` data = the user has no subscription. */
      subscription: AdminSection<AdminUserSubscriptionSummary | null>;
      sessions: AdminSection<readonly AdminUserSession[]>;
      activity: AdminSection<readonly AdminSecurityEvent[]>;
    }>;

/* ------------------------------------------------------------------------ */
/* Actions                                                                   */
/* ------------------------------------------------------------------------ */

/** Privileged intents the detail screen can report. */
export type AdminUserIntent =
  | Readonly<{ type: "lock" }>
  | Readonly<{ type: "unlock" }>
  | Readonly<{ type: "signOutAll" }>
  | Readonly<{ type: "revokeSession"; session: AdminUserSession }>
  | Readonly<{ type: "assignRole"; role: AdminRoleRef }>
  | Readonly<{ type: "removeRole"; role: AdminRoleRef }>;

export type AdminUserIntentType = AdminUserIntent["type"];

/** What the adapter receives after the administrator confirms. */
export type AdminUserActionRequest = Readonly<{
  intent: AdminUserIntent;
  /** Present for step-up actions; the backend verifies it. */
  stepUp?: StepUpSubmission;
}>;

/**
 * Performs a confirmed request. Resolve when the backend accepted it (the
 * page then re-reads the user); reject on failure. Never resolve for an
 * action that was not performed.
 */
export type AdminUserActionHandler = (
  request: AdminUserActionRequest,
) => Promise<unknown>;

/** Lock when active, unlock when locked; nothing for an unknown status. */
export function accountActionFor(
  status: AdminAccountStatus,
): Readonly<{ type: "lock" } | { type: "unlock" }> | null {
  if (status === "active") return { type: "lock" };
  if (status === "locked") return { type: "unlock" };
  return null;
}

/** Roles the user does not already hold. */
export function rolesAvailableToAssign(
  assignable: readonly AdminRoleRef[],
  held: readonly AdminRoleRef[],
): readonly AdminRoleRef[] {
  const heldIds = new Set(held.map((role) => role.id));
  return assignable.filter((role) => !heldIds.has(role.id));
}

export type AdminUserConfirmation = Readonly<{
  /** "stepUp" collects an authenticator code; "confirm" is a plain dialog. */
  kind: "stepUp" | "confirm";
  title: string;
  description?: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  /** Why a fresh check is needed (step-up only). */
  stepUpDescription?: string;
}>;

/**
 * Confirmation copy for an intent. Account, all-session and role changes
 * ask for a fresh authenticator code (reference `AdminStepUp`, DR-072);
 * revoking one session is a plain confirmation. Copy states the intended
 * effect only — success is never shown by this screen.
 */
export function userActionConfirmation(
  intent: AdminUserIntent,
  user: Pick<AdminUserDetail, "displayName">,
): AdminUserConfirmation {
  const name = user.displayName;
  switch (intent.type) {
    case "lock":
      return {
        confirmLabel: "Lock account",
        description:
          "Signs the user out everywhere and blocks sign-in until the account is unlocked.",
        kind: "stepUp",
        stepUpDescription:
          "Locking an account needs a fresh authenticator check.",
        title: `Lock ${name}`,
        tone: "danger",
      };
    case "unlock":
      return {
        confirmLabel: "Unlock account",
        description: "Lets the user sign in again.",
        kind: "stepUp",
        stepUpDescription:
          "Unlocking an account needs a fresh authenticator check.",
        title: `Unlock ${name}`,
        tone: "primary",
      };
    case "signOutAll":
      return {
        confirmLabel: "Sign out all sessions",
        description: "Ends every active session for this user.",
        kind: "stepUp",
        stepUpDescription:
          "Signing a user out everywhere needs a fresh authenticator check.",
        title: `Sign out ${name} everywhere`,
        tone: "danger",
      };
    case "revokeSession":
      return {
        confirmLabel: "Revoke session",
        description: `Ends the "${intent.session.label}" session for ${name}.`,
        kind: "confirm",
        title: "Revoke this session?",
        tone: "danger",
      };
    case "assignRole":
      return {
        confirmLabel: "Assign role",
        description: `Gives ${name} the ${intent.role.name} role. Changes take effect on the user's next request.`,
        kind: "stepUp",
        stepUpDescription: "Changing roles needs a fresh authenticator check.",
        title: `Assign ${intent.role.name}`,
        tone: "primary",
      };
    case "removeRole":
      return {
        confirmLabel: "Remove role",
        description: `Removes the ${intent.role.name} role from ${name}. Changes take effect on the user's next request.`,
        kind: "stepUp",
        stepUpDescription: "Changing roles needs a fresh authenticator check.",
        title: `Remove ${intent.role.name}`,
        tone: "danger",
      };
  }
}

/** Fixed, safe failure copy; raw errors are never shown. */
export const USER_ACTION_FAILED =
  "The action couldn't be completed. Check the user's current state, then try again.";

/**
 * Runs a confirmed request and reports whether the dialog may close.
 * "done" only when the handler resolved; anything else is "failed".
 */
export async function runAdminUserAction(
  handler: AdminUserActionHandler,
  request: AdminUserActionRequest,
): Promise<"done" | "failed"> {
  try {
    await handler(request);
    return "done";
  } catch {
    return "failed";
  }
}
