import type {
  AdminPermissionGroup,
  AdminPermissionMatrix,
  AdminRoleEditModel,
  AdminRolesModel,
} from "./roles-model";

/*
 * PREVIEW ONLY. Typed, deterministic fixtures for the roles list, permission
 * matrix and read-only role editor, used by tests (the isolated harness for
 * ADM-ROLES / ADM-ROLE-EDIT). The 16 permissions × 5 roles mirror the
 * reference layout as a visual sample — they are NOT an authoritative
 * permission catalogue and are never evaluated (DR-073). Production modules
 * must never import this file; `roles-screen.test.tsx` and the users
 * boundary test enforce it.
 */

export const fixturePermissionGroups: readonly AdminPermissionGroup[] = [
  {
    id: "users",
    label: "Users",
    permissions: [
      {
        description:
          "Profiles, account status, sessions and security activity.",
        key: "users.read",
        label: "View users",
      },
      {
        description:
          "Lock or unlock accounts, revoke sessions and assign roles.",
        key: "users.manage",
        label: "Manage users",
      },
      {
        description: "Registration and active-user reports.",
        key: "users.analytics.read",
        label: "User analytics",
      },
    ],
  },
  {
    id: "kyc",
    label: "KYC",
    permissions: [
      {
        description: "KYC queue, status history and provider references.",
        key: "kyc.read",
        label: "View verifications",
      },
      {
        description: "Refresh a verification when allowed.",
        key: "kyc.manage",
        label: "Manage verifications",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    permissions: [
      { key: "payments.read", label: "View payments" },
      { key: "payments.manage", label: "Manage payment providers" },
      { key: "payments.analytics.read", label: "Payment analytics" },
    ],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    permissions: [
      { key: "subscriptions.read", label: "View subscriptions" },
      { key: "subscriptions.manage", label: "Manage subscriptions" },
      { key: "subscriptions.allocate", label: "Allocate subscriptions" },
      { key: "subscriptions.plans.manage", label: "Manage plans" },
      { key: "subscriptions.analytics.read", label: "Subscription analytics" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    permissions: [
      { key: "providers.manage", label: "Manage service providers" },
      { key: "roles.read", label: "View roles" },
      { key: "roles.manage", label: "Manage roles" },
    ],
  },
];

const allKeys = fixturePermissionGroups.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
);

export const fixtureGrants: Readonly<Record<string, readonly string[]>> = {
  "role-fixture-admin": allKeys,
  "role-fixture-compliance": ["users.read", "kyc.read", "kyc.manage"],
  "role-fixture-finance": [
    "payments.read",
    "payments.manage",
    "payments.analytics.read",
    "subscriptions.read",
    "subscriptions.manage",
    "subscriptions.allocate",
    "subscriptions.analytics.read",
  ],
  "role-fixture-lead": [
    "users.read",
    "users.manage",
    "users.analytics.read",
    "kyc.read",
    "subscriptions.read",
  ],
  "role-fixture-support": ["users.read", "subscriptions.read"],
};

export const fixtureMatrix: AdminPermissionMatrix = {
  grants: fixtureGrants,
  groups: fixturePermissionGroups,
  roles: [
    { id: "role-fixture-admin", name: "Admin" },
    { id: "role-fixture-compliance", name: "Compliance" },
    { id: "role-fixture-finance", name: "Finance" },
    { id: "role-fixture-support", name: "Support" },
    { id: "role-fixture-lead", name: "Support lead" },
  ],
};

export const fixtureRolesModel: Extract<AdminRolesModel, { state: "ready" }> = {
  matrix: { data: fixtureMatrix, state: "ready" },
  roles: [
    {
      description: "Full access.",
      id: "role-fixture-admin",
      kind: "system",
      memberCount: 3,
      name: "Administrator",
      permissionCount: 16,
    },
    {
      id: "role-fixture-compliance",
      kind: "system",
      memberCount: 4,
      name: "Compliance officer",
      permissionCount: 3,
    },
    {
      id: "role-fixture-finance",
      kind: "system",
      name: "Finance officer",
      permissionCount: 7,
    },
    {
      id: "role-fixture-support",
      kind: "system",
      memberCount: 0,
      name: "Support agent",
    },
    {
      description: "Fixture custom role.",
      id: "role-fixture-lead",
      kind: "custom",
      memberCount: 2,
      name: "Support lead",
      permissionCount: 5,
    },
  ],
  state: "ready",
  totalPermissions: allKeys.length,
};

export function fixtureRoleEditModel(
  kind: "system" | "custom" = "custom",
): Extract<AdminRoleEditModel, { state: "ready" }> {
  return {
    groups: { data: fixturePermissionGroups, state: "ready" },
    members: {
      data: [
        {
          displayName: "Blake Fixture",
          email: "blake@fixture.test",
          id: "usr-fixture-0002",
        },
        {
          displayName: "Drew Fixture",
          email: "drew@fixture.test",
          id: "usr-fixture-0004",
        },
      ],
      state: "ready",
    },
    role: {
      description: "Fixture custom role.",
      id: "role-fixture-lead",
      kind,
      name: "Support lead",
      permissions: fixtureGrants["role-fixture-lead"] ?? [],
      updatedAt: "2026-01-20T09:00:00Z",
      updatedBy: "Fixture Admin",
    },
    state: "ready",
  };
}
