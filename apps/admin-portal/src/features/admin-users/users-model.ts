import {
  lookupAdminBadge,
  type AdminBadge,
  type AdminDetailState,
  type AdminListState,
  type AdminSection,
  type StepUpSubmission,
} from "@/components/admin-patterns";
import type { AdminKycStatus } from "@/features/admin-kyc/kyc-model";

/*
 * Admin user management view models (ADM-USERS, ADM-USER-DETAIL).
 *
 * There is no admin user API (DR-071, DR-072): nothing in production builds
 * these models, and every action is an intent the future adapter performs
 * through the backend. These are local presentation types, not API DTOs.
 * Admin access today is one configured role claim (`proxy.ts`); the
 * permission names in the reference (users.read, users.manage) are future
 * targets and are never evaluated here.
 *
 * The KYC status vocabulary comes from `admin-kyc` (one-way): KYC owns what
 * verification statuses mean, and the users list and detail only show them.
 */

export const ADMIN_ACCOUNT_STATUSES = ["active", "locked"] as const;
export type AdminAccountStatus =
  (typeof ADMIN_ACCOUNT_STATUSES)[number] | "unknown";

const accountBadges: Readonly<Record<string, AdminBadge>> = {
  active: { label: "Active", tone: "success" },
  locked: { label: "Locked", tone: "danger" },
};

export function accountStatusBadge(status: string): AdminBadge {
  return lookupAdminBadge(accountBadges, status);
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

export const adminUserSortLabels: Readonly<Record<AdminUserSort, string>> = {
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
  if (current[key] === value) {
    return null;
  }
  return { ...current, [key]: value };
}

export type AdminUsersListModel = AdminListState<AdminUserListItem>;

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

const subscriptionBadges: Readonly<Record<string, AdminBadge>> = {
  active: { label: "Active", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  cancelling: { label: "Cancels at period end", tone: "warning" },
  pastDue: { label: "Past due", tone: "danger" },
};

export function subscriptionStatusBadge(status: string): AdminBadge {
  return lookupAdminBadge(subscriptionBadges, status);
}

export type AdminUserSubscriptionSummary = Readonly<{
  planName: string;
  /** Display interval, for example "monthly". */
  interval?: string;
  /** Raw status; unrecognised values show "Unknown". */
  status: string;
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

/** Everything the detail screen shows for one user. */
export type AdminUserDetailRecord = Readonly<{
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

export type AdminUserDetailModel = AdminDetailState<AdminUserDetailRecord>;

/* ------------------------------------------------------------------------ */
/* Actions                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Privileged intents. Each names its target explicitly — the user and,
 * where relevant, the role or session — captured when the confirmation
 * opens, so a confirmed request can never apply to a different record.
 */
export type AdminUserIntent =
  | Readonly<{ type: "lock"; userId: string }>
  | Readonly<{ type: "unlock"; userId: string }>
  | Readonly<{ type: "signOutAll"; userId: string }>
  | Readonly<{
      type: "revokeSession";
      userId: string;
      sessionId: string;
      sessionLabel: string;
    }>
  | Readonly<{
      type: "assignRole";
      userId: string;
      roleId: string;
      roleName: string;
    }>
  | Readonly<{
      type: "removeRole";
      userId: string;
      roleId: string;
      roleName: string;
    }>;

export type AdminUserIntentType = AdminUserIntent["type"];

/** What the adapter receives after the administrator confirms. */
export type AdminUserActionRequest = Readonly<{
  intent: AdminUserIntent;
  /** Present for step-up actions; the backend verifies it. */
  stepUp?: StepUpSubmission;
}>;

/**
 * Performs a confirmed request. Resolve when the backend accepted it (the
 * page then re-reads the user); reject with the normalized error on
 * failure. Never resolve for an action that was not performed.
 */
export type AdminUserActionHandler = (
  request: AdminUserActionRequest,
) => Promise<unknown>;

/** Lock when active, unlock when locked; nothing for an unknown status. */
export function accountActionFor(
  status: AdminAccountStatus,
): "lock" | "unlock" | null {
  if (status === "active") {
    return "lock";
  }
  if (status === "locked") {
    return "unlock";
  }
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

/**
 * Whether a captured intent still applies to the record on screen: the
 * same user, an account status that permits it, and a role or session that
 * still exists. Checked while the confirmation is open and again just
 * before submitting. The backend remains the authority.
 */
export function isUserIntentStillAllowed(
  intent: AdminUserIntent,
  record: AdminUserDetailRecord,
): boolean {
  const { user } = record;
  if (user.id !== intent.userId) {
    return false;
  }
  switch (intent.type) {
    case "lock":
    case "unlock":
      return accountActionFor(user.accountStatus) === intent.type;
    case "signOutAll":
      return true;
    case "revokeSession":
      return (
        record.sessions.state === "ready" &&
        record.sessions.data.some((session) => session.id === intent.sessionId)
      );
    case "assignRole": {
      if (record.assignableRoles.state !== "ready") {
        return false;
      }
      const available = rolesAvailableToAssign(
        record.assignableRoles.data,
        user.roles,
      );
      return available.some((role) => role.id === intent.roleId);
    }
    case "removeRole":
      return user.roles.some((role) => role.id === intent.roleId);
  }
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
 * assume a fresh authenticator check (reference `AdminStepUp`); revoking
 * one session is a plain confirmation. Which actions really need step-up is
 * the backend's decision (DR-072, DR-121). Copy states the intended effect
 * only — success is never shown by this screen.
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
        description: `Ends the "${intent.sessionLabel}" session for ${name}.`,
        kind: "confirm",
        title: "Revoke this session?",
        tone: "danger",
      };
    case "assignRole":
      return {
        confirmLabel: "Assign role",
        description: `Gives ${name} the ${intent.roleName} role.`,
        kind: "stepUp",
        stepUpDescription: "Changing roles needs a fresh authenticator check.",
        title: `Assign ${intent.roleName}`,
        tone: "primary",
      };
    case "removeRole":
      return {
        confirmLabel: "Remove role",
        description: `Removes the ${intent.roleName} role from ${name}.`,
        kind: "stepUp",
        stepUpDescription: "Changing roles needs a fresh authenticator check.",
        title: `Remove ${intent.roleName}`,
        tone: "danger",
      };
  }
}

/** Shown when an open confirmation no longer matches the record. */
export const USER_ACTION_INVALIDATED =
  "The confirmation was closed because this user's details changed. Review the current state before trying again.";
