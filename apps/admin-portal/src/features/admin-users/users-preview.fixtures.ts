import type {
  AdminRoleRef,
  AdminUserDetail,
  AdminUserDetailModel,
  AdminUserFilters,
  AdminUserListItem,
  AdminUsersListModel,
} from "./users-model";

/*
 * PREVIEW ONLY. Typed, deterministic, synthetic fixtures for the admin users
 * list and detail compositions, used by tests (the isolated harness for
 * ADM-USERS / ADM-USER-DETAIL). Fixed timestamps; `fixture.test` emails; no
 * reference sample people. Production modules must never import this file,
 * use it as a fallback for a failed request, or expose it behind a toggle;
 * `users-screen.test.tsx` enforces the import rule. The filter/sort/page
 * helper below only exercises the composition — it is not server behaviour.
 */

export const fixtureRoles = {
  compliance: { id: "role-fixture-compliance", name: "Compliance officer" },
  finance: { id: "role-fixture-finance", name: "Finance officer" },
  support: { id: "role-fixture-support", name: "Support agent" },
} as const satisfies Record<string, AdminRoleRef>;

export const fixtureRoleOptions = Object.values(fixtureRoles).map((role) => ({
  label: role.name,
  value: role.id,
}));

export const fixturePlanOptions = [
  { label: "Fixture Basic", value: "Fixture Basic" },
  { label: "Fixture Standard", value: "Fixture Standard" },
];

export const fixtureUsers: readonly AdminUserListItem[] = [
  {
    accountStatus: "active",
    displayName: "Avery Fixture",
    email: "avery@fixture.test",
    id: "usr-fixture-0001",
    kycStatus: "verified",
    lastLoginAt: "2026-01-20T08:12:00Z",
    planName: "Fixture Standard",
    roles: [],
  },
  {
    accountStatus: "active",
    displayName: "Blake Fixture",
    email: "blake@fixture.test",
    id: "usr-fixture-0002",
    kycStatus: "pending",
    lastLoginAt: "2026-01-19T17:40:00Z",
    planName: "Fixture Basic",
    roles: [fixtureRoles.support],
  },
  {
    accountStatus: "locked",
    displayName: "Casey Fixture",
    email: "casey@fixture.test",
    id: "usr-fixture-0003",
    kycStatus: "rejected",
    lastLoginAt: "2026-01-12T09:00:00Z",
    planName: null,
    roles: [],
  },
  {
    accountStatus: "active",
    displayName: "Drew Fixture",
    email: "drew@fixture.test",
    id: "usr-fixture-0004",
    kycStatus: "notStarted",
    lastLoginAt: null,
    planName: null,
    roles: [fixtureRoles.finance, fixtureRoles.compliance],
  },
  {
    accountStatus: "unknown",
    displayName: "Emery Fixture",
    email: "emery@fixture.test",
    id: "usr-fixture-0005",
    roles: [],
  },
];

/** Synthetic query over `fixtureUsers` for the interaction tests only. */
export function previewUserQuery(
  filters: AdminUserFilters,
  page = 1,
  pageSize = 2,
): Extract<AdminUsersListModel, { state: "ready" }> {
  const query = filters.query.trim().toLowerCase();
  const matching = fixtureUsers.filter(
    (user) =>
      (!query ||
        user.displayName.toLowerCase().includes(query) ||
        user.email.includes(query) ||
        user.id.includes(query)) &&
      (filters.status === "any" || user.accountStatus === filters.status) &&
      (filters.kyc === "any" || user.kycStatus === filters.kyc) &&
      (filters.role === "any" ||
        user.roles.some((role) => role.id === filters.role)) &&
      (filters.plan === "any" || user.planName === filters.plan),
  );
  const sorted = [...matching].sort((a, b) => {
    switch (filters.sort) {
      case "name":
        return a.displayName.localeCompare(b.displayName);
      case "oldest":
        return a.id.localeCompare(b.id);
      case "lastLogin":
        return (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? "");
      case "newest":
        return b.id.localeCompare(a.id);
    }
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  return {
    page,
    pageSize,
    state: "ready",
    totalItems: sorted.length,
    totalPages,
    users: sorted.slice((page - 1) * pageSize, page * pageSize),
  };
}

export const fixtureUserDetail: AdminUserDetail = {
  account: {
    country: "Fixture Country",
    createdAt: "2026-01-03T10:14:00Z",
    fullName: "Blake Fixture",
    language: "English",
    lastActiveAt: "2026-01-19T17:40:00Z",
    lastLoginAt: "2026-01-19T08:12:00Z",
    signInMethods: ["Password", "Google", "1 passkey"],
    twoFactorEnabled: true,
  },
  accountStatus: "active",
  displayName: "Blake Fixture",
  email: "blake@fixture.test",
  emailConfirmed: true,
  id: "usr-fixture-0002",
  roles: [fixtureRoles.support],
  tenantName: "Fixture tenant",
};

export function fixtureUserDetailModel(
  overrides: Partial<AdminUserDetail> = {},
): Extract<AdminUserDetailModel, { state: "ready" }> {
  return {
    activity: {
      data: [
        {
          device: "Chrome · Windows",
          event: "Signed in",
          id: "evt-fixture-1",
          location: "Fixture City",
          occurredAt: "2026-01-19T08:12:00Z",
        },
        { event: "Failed sign-in", id: "evt-fixture-2" },
      ],
      state: "ready",
    },
    assignableRoles: { data: Object.values(fixtureRoles), state: "ready" },
    kyc: {
      data: {
        attemptNumber: 3,
        startedAt: "2026-01-18T10:32:00Z",
        status: "pending",
        verificationId: "vrf-fixture-0003",
      },
      state: "ready",
    },
    sessions: {
      data: [
        {
          current: true,
          id: "ses-fixture-1",
          label: "Chrome on Windows",
          location: "Fixture City",
        },
        {
          id: "ses-fixture-2",
          label: "Safari on iPhone",
          lastActiveAt: "2026-01-17T12:03:00Z",
          location: "Fixture City",
        },
      ],
      state: "ready",
    },
    state: "ready",
    subscription: {
      data: {
        autoRenew: true,
        interval: "monthly",
        planName: "Fixture Basic",
        renewsAt: "2026-02-03T00:00:00Z",
        status: "active",
      },
      state: "ready",
    },
    user: { ...fixtureUserDetail, ...overrides },
  };
}
