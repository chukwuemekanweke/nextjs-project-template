import type {
  AdminScreenBlocked,
  AdminSection,
} from "@/features/admin-users/admin-view";

/*
 * Admin roles and permissions view models (ADM-ROLES, ADM-ROLE-EDIT).
 *
 * There is no permission model or role API (DR-073): admin access today is
 * one configured role claim checked by `proxy.ts`. Roles, permission keys
 * and grants are backend-owned; these local presentation types only
 * visualise what a future source reports. The 16-permission catalogue in
 * the reference is not authoritative and exists here only as a test
 * fixture. Nothing in this module grants, evaluates or persists access, and
 * a production role editor is out of scope (CAF-FE-008).
 */

export type AdminRoleKind = "system" | "custom";

export type AdminRoleSummary = Readonly<{
  id: string;
  name: string;
  description?: string;
  kind: AdminRoleKind;
  /** `undefined` = not reported (never shown as 0). */
  permissionCount?: number;
  memberCount?: number;
}>;

export type AdminPermission = Readonly<{
  /** Backend permission key, for example "users.read". */
  key: string;
  label: string;
  description?: string;
}>;

export type AdminPermissionGroup = Readonly<{
  id: string;
  label: string;
  permissions: readonly AdminPermission[];
}>;

/** Read-only role × permission overview. */
export type AdminPermissionMatrix = Readonly<{
  groups: readonly AdminPermissionGroup[];
  roles: readonly Readonly<{ id: string; name: string }>[];
  /** Granted permission keys by role id. */
  grants: Readonly<Record<string, readonly string[]>>;
}>;

export type AdminRolesModel =
  | AdminScreenBlocked
  | Readonly<{
      state: "ready";
      roles: readonly AdminRoleSummary[];
      /** Size of the backend catalogue, for "5 of 16". */
      totalPermissions?: number;
      matrix: AdminSection<AdminPermissionMatrix>;
    }>;

export type AdminRoleMember = Readonly<{
  id: string;
  displayName: string;
  email: string;
}>;

export type AdminRoleDetail = Readonly<{
  id: string;
  name: string;
  description?: string;
  kind: AdminRoleKind;
  /** Granted permission keys. */
  permissions: readonly string[];
  updatedAt?: string;
  updatedBy?: string;
}>;

export type AdminRoleEditModel =
  | AdminScreenBlocked
  | Readonly<{ state: "notFound" }>
  | Readonly<{
      state: "ready";
      role: AdminRoleDetail;
      groups: AdminSection<readonly AdminPermissionGroup[]>;
      members: AdminSection<readonly AdminRoleMember[]>;
    }>;

export const roleKindLabels: Record<AdminRoleKind, string> = {
  custom: "Custom",
  system: "System",
};

/** "5 of 16", "5" without a catalogue size, `undefined` when unreported. */
export function permissionCountLabel(
  count: number | undefined,
  total: number | undefined,
): string | undefined {
  if (count === undefined || !Number.isSafeInteger(count) || count < 0) {
    return undefined;
  }
  return total !== undefined && total >= count
    ? `${count} of ${total}`
    : String(count);
}

export function isPermissionGranted(
  matrix: Pick<AdminPermissionMatrix, "grants">,
  roleId: string,
  key: string,
): boolean {
  return matrix.grants[roleId]?.includes(key) ?? false;
}

/** Granted / total keys within one group. */
export function groupGrantCount(
  group: AdminPermissionGroup,
  granted: readonly string[],
): Readonly<{ granted: number; total: number }> {
  const keys = new Set(granted);
  return {
    granted: group.permissions.filter((permission) => keys.has(permission.key))
      .length,
    total: group.permissions.length,
  };
}

/** Explains why the role editor is read-only. */
export const ROLE_EDITING_UNAVAILABLE =
  "Role editing is not available. Roles and permissions are defined by the backend, which has no role-management API yet; this view is read-only.";
