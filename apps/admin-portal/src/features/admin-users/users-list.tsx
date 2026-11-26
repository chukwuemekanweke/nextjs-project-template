"use client";

import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import { Avatar, Badge, Chip, type TableColumn } from "@template/ui-core";
import {
  AdminDateTime,
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  AdminNotAvailable,
  type AdminOption,
} from "@/components/admin-patterns";
import { kycStatusBadge } from "@/features/admin-kyc/kyc-model";
import { AdminUserFilterBar } from "./users-filters";
import {
  DEFAULT_ADMIN_USER_FILTERS,
  accountStatusBadge,
  hasActiveUserFilters,
  type AdminRoleRef,
  type AdminUserFilters,
  type AdminUserListItem,
  type AdminUsersListModel,
} from "./users-model";

/*
 * Admin users list (reference `AdminUsers*`; Trello FE-UI-013).
 * Presentation only: it renders the list state it is given and reports
 * filter and page changes. There is no route or navigation item until an
 * admin user API exists (DR-071); typed preview data lives in
 * `users-preview.fixtures.ts` and is used by tests only.
 */

function RoleChips({ roles }: Readonly<{ roles: readonly AdminRoleRef[] }>) {
  if (roles.length === 0) {
    return <span className="text-fg-subtle">None</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <Chip key={role.id}>{role.name}</Chip>
      ))}
    </span>
  );
}

function UserIdentity({ user }: Readonly<{ user: AdminUserListItem }>) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar decorative name={user.displayName} size="sm" />
      <span className="min-w-0 leading-tight">
        <span className="text-fg block font-semibold break-words">
          {user.displayName}
        </span>
        <span className="text-caption text-fg-subtle block break-all">
          {user.email}
        </span>
      </span>
    </span>
  );
}

function PlanCell({ planName }: Readonly<{ planName?: string | null }>) {
  if (planName === undefined) {
    return <AdminNotAvailable />;
  }
  if (planName === null) {
    return <span className="text-fg-subtle">No plan</span>;
  }
  return <>{planName}</>;
}

function userColumns(
  getUserHref: ((userId: string) => string) | undefined,
): readonly TableColumn<AdminUserListItem>[] {
  const columns: TableColumn<AdminUserListItem>[] = [
    { cell: (user) => <UserIdentity user={user} />, header: "User" },
    {
      cell: (user) => {
        const badge = accountStatusBadge(user.accountStatus);
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
      className: "whitespace-nowrap",
      header: "Status",
    },
    {
      cell: (user) => {
        if (!user.kycStatus) {
          return <AdminNotAvailable />;
        }
        const badge = kycStatusBadge(user.kycStatus);
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
      className: "whitespace-nowrap",
      header: "KYC",
    },
    { cell: (user) => <PlanCell planName={user.planName} />, header: "Plan" },
    { cell: (user) => <RoleChips roles={user.roles} />, header: "Role" },
    {
      cell: (user) =>
        user.lastLoginAt === null ? (
          "Never"
        ) : (
          <AdminDateTime value={user.lastLoginAt} />
        ),
      className: "whitespace-nowrap",
      header: "Last login",
    },
  ];
  if (getUserHref) {
    columns.push({
      align: "right",
      cell: (user) => (
        <Link
          aria-label={`View ${user.displayName}`}
          className="text-brand-ink font-medium hover:underline focus-visible:underline"
          href={getUserHref(user.id)}
        >
          View
        </Link>
      ),
      header: "Actions",
      mobileLabel: "",
    });
  }
  return columns;
}

/**
 * Users page body: header, filters, the users table and paging. Detail
 * links appear only with `getUserHref` (an implemented route); paging
 * controls only with `onPageChange`.
 */
export function AdminUsersScreen({
  filters = DEFAULT_ADMIN_USER_FILTERS,
  getUserHref,
  model,
  onFiltersChange,
  onPageChange,
  onReload,
  planOptions,
  roleOptions,
}: Readonly<{
  filters?: AdminUserFilters;
  getUserHref?: (userId: string) => string;
  model: AdminUsersListModel;
  onFiltersChange?: (filters: AdminUserFilters) => void;
  onPageChange?: (page: number) => void;
  onReload?: () => void;
  planOptions?: readonly AdminOption[];
  roleOptions?: readonly AdminOption[];
}>) {
  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.requestDetails}
        resourceLabel="Users"
      />
    );
  }

  const filtered = hasActiveUserFilters(filters);

  return (
    <section className="space-y-6">
      <DashboardHeader
        description="Find a user and manage their account, sessions and roles."
        title="Users"
      />
      <AdminListCard
        footer={
          <AdminListPager
            label="Users pages"
            onPageChange={onPageChange}
            state={model}
          />
        }
        title="All users"
        toolbar={
          <AdminUserFilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            planOptions={planOptions}
            roleOptions={roleOptions}
          />
        }
      >
        <AdminListTable
          caption="Users"
          columns={userColumns(getUserHref)}
          emptyDescription={
            filtered
              ? "Try a different search or fewer filters."
              : "Users appear here once they register."
          }
          emptyTitle={
            filtered ? "No users match these filters" : "No users yet"
          }
          keyField={(user) => user.id}
          loadingLabel="Loading users"
          onPageChange={onPageChange}
          onRetry={onReload}
          state={model}
        />
      </AdminListCard>
    </section>
  );
}
