"use client";

import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  FormField,
  IconTile,
  KeyValueList,
  ListRow,
  LoadingStatus,
  MonitorIcon,
  Pager,
  SearchInput,
  Select,
  Skeleton,
  SkeletonText,
  UsersIcon,
  describePageRange,
  type KeyValueItem,
  type TableColumn,
} from "@template/ui-core";
import { useId, useState, type ReactNode } from "react";
import {
  AdminDetailHeader,
  AdminFilterBar,
  AdminForbidden,
  AdminListCard,
  AdminStepUpDialog,
  type StepUpSubmission,
} from "@/components/admin-patterns";
import {
  ADMIN_KYC_STATUSES,
  kycStatusBadge,
} from "@/features/admin-kyc/kyc-model";
import {
  ADMIN_FILTERS_UNAVAILABLE,
  AdminDateTime,
  AdminSectionBody,
  NotAvailable,
  UnavailableHint,
  formatAdminDateTime,
  type AdminDateOptions,
  type AdminFilterOption,
} from "./admin-view";
import {
  ADMIN_ACCOUNT_STATUSES,
  ADMIN_USER_SORTS,
  DEFAULT_ADMIN_USER_FILTERS,
  USER_ACTION_FAILED,
  accountActionFor,
  accountStatusBadge,
  adminUserSortLabels,
  hasActiveUserFilters,
  nextUserFilters,
  rolesAvailableToAssign,
  runAdminUserAction,
  subscriptionStatusBadge,
  userActionConfirmation,
  type AdminRoleRef,
  type AdminSecurityEvent,
  type AdminUserActionHandler,
  type AdminUserDetail,
  type AdminUserDetailModel,
  type AdminUserFilters,
  type AdminUserIntent,
  type AdminUserListItem,
  type AdminUsersListModel,
} from "./users-model";

/*
 * Admin users list and user detail compositions (reference `AdminUsers*`,
 * `AdminUserDetail*`; Trello FE-UI-013). Presentation only: they render the
 * model they are given and report filter changes and confirmed intents.
 * There is no route or navigation item until an admin user API exists
 * (DR-071, DR-072); typed preview data lives in `users-preview.fixtures.ts`
 * and is used by tests only.
 */

const accountLabels = Object.fromEntries(
  ADMIN_ACCOUNT_STATUSES.map((status) => [
    status,
    accountStatusBadge(status).label,
  ]),
);
const kycLabels = Object.fromEntries(
  ADMIN_KYC_STATUSES.map((status) => [status, kycStatusBadge(status).label]),
);

/* ------------------------------------------------------------------------ */
/* Users list                                                                */
/* ------------------------------------------------------------------------ */

function FilterSelect({
  describedBy,
  disabled,
  label,
  onChange,
  options,
  value,
}: Readonly<{
  describedBy?: string;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly AdminFilterOption[];
  value: string;
}>) {
  const id = useId();
  return (
    <FormField
      className="min-w-[150px] flex-[1_1_150px]"
      inputId={id}
      label={label}
    >
      <Select
        aria-describedby={describedBy}
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="any">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

/**
 * Search, the five reference filter menus and sort. Controlled: changes go
 * to `onFiltersChange`; without it every control is inert and explained.
 * Role and plan options are backend-owned; without them those menus stay
 * inert even when the others are wired.
 */
export function AdminUserFilterBar({
  filters,
  onFiltersChange,
  planOptions,
  roleOptions,
}: Readonly<{
  filters: AdminUserFilters;
  onFiltersChange?: (filters: AdminUserFilters) => void;
  planOptions?: readonly AdminFilterOption[];
  roleOptions?: readonly AdminFilterOption[];
}>) {
  const hintId = useId();
  const inert = !onFiltersChange;
  const describedBy = inert ? hintId : undefined;

  function change<Key extends keyof AdminUserFilters>(
    key: Key,
    value: AdminUserFilters[Key],
  ) {
    const next = nextUserFilters(filters, key, value);
    if (next) onFiltersChange?.(next);
  }

  return (
    <div className="grid gap-2">
      <AdminFilterBar label="User filters">
        <FormField
          className="flex-[2_1_240px]"
          inputId={`${hintId}-q`}
          label="Search"
        >
          <SearchInput
            aria-describedby={describedBy}
            className="md:max-w-none"
            disabled={inert}
            id={`${hintId}-q`}
            onChange={(event) => change("query", event.target.value)}
            placeholder="Name, email or ID"
            value={filters.query}
          />
        </FormField>
        <FilterSelect
          describedBy={describedBy}
          disabled={inert}
          label="Status"
          onChange={(value) =>
            change("status", value as AdminUserFilters["status"])
          }
          options={ADMIN_ACCOUNT_STATUSES.map((status) => ({
            label: accountLabels[status] ?? status,
            value: status,
          }))}
          value={filters.status}
        />
        <FilterSelect
          describedBy={describedBy}
          disabled={inert}
          label="KYC"
          onChange={(value) => change("kyc", value as AdminUserFilters["kyc"])}
          options={ADMIN_KYC_STATUSES.map((status) => ({
            label: kycLabels[status] ?? status,
            value: status,
          }))}
          value={filters.kyc}
        />
        <FilterSelect
          describedBy={describedBy}
          disabled={inert || !roleOptions}
          label="Role"
          onChange={(value) => change("role", value)}
          options={roleOptions ?? []}
          value={filters.role}
        />
        <FilterSelect
          describedBy={describedBy}
          disabled={inert || !planOptions}
          label="Plan"
          onChange={(value) => change("plan", value)}
          options={planOptions ?? []}
          value={filters.plan}
        />
        <FormField
          className="min-w-[150px] flex-[1_1_150px]"
          inputId={`${hintId}-sort`}
          label="Sort"
        >
          <Select
            aria-describedby={describedBy}
            disabled={inert}
            id={`${hintId}-sort`}
            onChange={(event) => {
              const sort = ADMIN_USER_SORTS.find(
                (value) => value === event.target.value,
              );
              if (sort) change("sort", sort);
            }}
            value={filters.sort}
          >
            {ADMIN_USER_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {adminUserSortLabels[sort]}
              </option>
            ))}
          </Select>
        </FormField>
      </AdminFilterBar>
      {inert ? (
        <UnavailableHint id={hintId}>
          {ADMIN_FILTERS_UNAVAILABLE}
        </UnavailableHint>
      ) : null}
    </div>
  );
}

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

function userColumns(
  dates: AdminDateOptions | undefined,
  getUserHref: ((userId: string) => string) | undefined,
): readonly TableColumn<AdminUserListItem>[] {
  const columns: TableColumn<AdminUserListItem>[] = [
    {
      cell: (user) => (
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
      ),
      header: "User",
    },
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
        if (!user.kycStatus) return <NotAvailable />;
        const badge = kycStatusBadge(user.kycStatus);
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
      className: "whitespace-nowrap",
      header: "KYC",
    },
    {
      cell: (user) =>
        user.planName === undefined ? (
          <NotAvailable />
        ) : user.planName === null ? (
          <span className="text-fg-subtle">No plan</span>
        ) : (
          user.planName
        ),
      header: "Plan",
    },
    {
      cell: (user) => <RoleChips roles={user.roles} />,
      header: "Role",
    },
    {
      cell: (user) =>
        user.lastLoginAt === null ? (
          "Never"
        ) : (
          <AdminDateTime dates={dates} value={user.lastLoginAt} />
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
  dates,
  filters = DEFAULT_ADMIN_USER_FILTERS,
  getUserHref,
  model,
  onFiltersChange,
  onPageChange,
  onReload,
  planOptions,
  roleOptions,
}: Readonly<{
  dates?: AdminDateOptions;
  filters?: AdminUserFilters;
  getUserHref?: (userId: string) => string;
  model: AdminUsersListModel;
  onFiltersChange?: (filters: AdminUserFilters) => void;
  onPageChange?: (page: number) => void;
  onReload?: () => void;
  planOptions?: readonly AdminFilterOption[];
  roleOptions?: readonly AdminFilterOption[];
}>) {
  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.details}
        resourceLabel="Users"
      />
    );
  }

  const filtered = hasActiveUserFilters(filters);
  let footer: ReactNode = null;
  if (model.state === "ready" && model.users.length > 0) {
    footer = onPageChange ? (
      <Pager
        className="w-full border-t-0 p-0 md:p-0"
        label="Users pagination"
        onPageChange={onPageChange}
        page={model.page}
        pageSize={model.pageSize}
        totalItems={model.totalItems}
        totalPages={model.totalPages}
      />
    ) : (
      <p className="text-label text-fg-muted">
        {describePageRange({
          page: model.page,
          pageSize: model.pageSize,
          totalItems: model.totalItems,
          totalPages: model.totalPages,
        })}
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <DashboardHeader
        description="Find a user and manage their account, sessions and roles."
        title="Users"
      />
      <AdminListCard
        footer={footer}
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
        <DataTable
          caption="Users"
          columns={userColumns(dates, getUserHref)}
          empty={
            filtered ? (
              <EmptyState
                action={
                  onFiltersChange ? (
                    <Button
                      onClick={() =>
                        onFiltersChange({
                          ...DEFAULT_ADMIN_USER_FILTERS,
                          sort: filters.sort,
                        })
                      }
                      size="sm"
                      variant="secondary"
                    >
                      Clear filters
                    </Button>
                  ) : undefined
                }
                className="border-0 py-2"
                description="Try a different search or fewer filters."
                icon={<UsersIcon />}
                title="No users match these filters"
              />
            ) : (
              <EmptyState
                className="border-0 py-2"
                description="Users appear here once they register."
                icon={<UsersIcon />}
                title="No users yet"
              />
            )
          }
          error={
            model.state === "error" ? (
              <ErrorState
                className="py-2"
                description="The user list could not be loaded."
                onRetry={onReload}
                title="Couldn't load users"
              />
            ) : undefined
          }
          keyField={(user) => user.id}
          loading={model.state === "loading"}
          loadingLabel="Loading users"
          mobileLayout="stack"
          rows={model.state === "ready" ? model.users : []}
          variant="embedded"
        />
      </AdminListCard>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* User detail: confirmation                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Confirmation for a privileged intent: `AdminStepUpDialog` (authenticator
 * code) or `ConfirmDialog`. Stateless; the screen owns open/pending/error.
 */
export function UserActionConfirmation({
  error,
  intent,
  onCancel,
  onSubmit,
  open,
  pending,
  user,
}: Readonly<{
  error: string | null;
  intent: AdminUserIntent;
  onCancel: () => void;
  onSubmit: (stepUp?: StepUpSubmission) => void;
  open: boolean;
  pending: boolean;
  user: Pick<AdminUserDetail, "displayName">;
}>) {
  const copy = userActionConfirmation(intent, user);
  if (copy.kind === "stepUp") {
    return (
      <AdminStepUpDialog
        action={{ description: copy.description, title: copy.title }}
        confirmLabel={copy.confirmLabel}
        confirmTone={copy.tone}
        description={copy.stepUpDescription ?? ""}
        error={error}
        onCancel={onCancel}
        onSubmit={(submission) => onSubmit(submission)}
        open={open}
        pending={pending}
      />
    );
  }
  return (
    <ConfirmDialog
      confirmLabel={copy.confirmLabel}
      description={copy.description}
      onCancel={onCancel}
      onConfirm={() => onSubmit()}
      open={open}
      pending={pending}
      title={copy.title}
      tone={copy.tone}
    >
      {error ? (
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}

/* ------------------------------------------------------------------------ */
/* User detail: sections                                                     */
/* ------------------------------------------------------------------------ */

function accountItems(
  user: AdminUserDetail,
  dates: AdminDateOptions | undefined,
): readonly KeyValueItem[] {
  const { account } = user;
  const text = (value: string | undefined) => value ?? <NotAvailable />;
  return [
    { label: "Full name", value: text(account.fullName) },
    { label: "Country", value: text(account.country) },
    { label: "Language", value: text(account.language) },
    {
      label: "Signed up",
      value: <AdminDateTime dates={dates} value={account.createdAt} />,
    },
    {
      label: "Last login",
      value:
        account.lastLoginAt === null ? (
          "Never"
        ) : (
          <AdminDateTime dates={dates} value={account.lastLoginAt} />
        ),
    },
    {
      label: "Last active",
      value: <AdminDateTime dates={dates} value={account.lastActiveAt} />,
    },
    {
      label: "Sign-in methods",
      value:
        account.signInMethods && account.signInMethods.length > 0 ? (
          account.signInMethods.join(" · ")
        ) : (
          <NotAvailable />
        ),
    },
    {
      label: "Two-factor",
      value:
        account.twoFactorEnabled === undefined ? (
          <NotAvailable />
        ) : account.twoFactorEnabled ? (
          <Badge tone="success">Enabled</Badge>
        ) : (
          <Badge tone="warning">Not enabled</Badge>
        ),
    },
  ];
}

function TitledCard({
  action,
  children,
  title,
}: Readonly<{ action?: ReactNode; children: ReactNode; title: string }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
        {action}
      </CardHeader>
      {children}
    </Card>
  );
}

function activityColumns(
  dates: AdminDateOptions | undefined,
): readonly TableColumn<AdminSecurityEvent>[] {
  const text = (value: string | undefined) => value ?? <NotAvailable />;
  return [
    {
      cell: (event) => (
        <span className="text-fg font-semibold">{event.event}</span>
      ),
      header: "Event",
    },
    { cell: (event) => text(event.device), header: "Device" },
    { cell: (event) => text(event.location), header: "Location" },
    {
      cell: (event) => <AdminDateTime dates={dates} value={event.occurredAt} />,
      className: "whitespace-nowrap",
      header: "When",
    },
  ];
}

function DetailSkeleton() {
  return (
    <Card aria-busy="true">
      <CardContent className="flex flex-wrap items-center gap-5">
        <LoadingStatus label="Loading user" />
        <Skeleton className="size-16 rounded-full" />
        <div className="grid flex-[1_1_240px] gap-3">
          <Skeleton className="h-7 w-56 max-w-full" />
          <SkeletonText lines={1} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * User detail page body (reference `AdminUserDetail`). Lock/unlock, sign
 * out everywhere and role changes open `AdminStepUpDialog`; revoking one
 * session opens `ConfirmDialog`. Confirmed requests go to `onAction`; the
 * dialog closes only when it resolves, and the screen never shows success
 * itself (the page re-reads the user). Without `onAction` every action is
 * disabled with an explanation.
 */
export function AdminUserDetailScreen({
  dates,
  getKycHref,
  listHref,
  model,
  onAction,
  onReload,
  rolesHref,
}: Readonly<{
  dates?: AdminDateOptions;
  /** Link to an implemented KYC detail route. */
  getKycHref?: (verificationId: string) => string;
  /** Implemented users list route, for the back link. */
  listHref?: string;
  model: AdminUserDetailModel;
  onAction?: AdminUserActionHandler;
  onReload?: () => void;
  /** Implemented roles route ("Manage roles"). */
  rolesHref?: string;
}>) {
  const hintId = useId();
  const roleSelectId = useId();
  const [confirming, setConfirming] = useState<AdminUserIntent | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");

  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.details}
        resourceLabel="User details"
      />
    );
  }

  const back = listHref ? { href: listHref, label: "All users" } : undefined;

  if (model.state === "loading") return <DetailSkeleton />;
  if (model.state === "error" || model.state === "notFound") {
    return (
      <section className="space-y-6">
        {back ? (
          <Link
            className="text-small text-brand-ink font-medium"
            href={back.href}
          >
            {back.label}
          </Link>
        ) : null}
        <Card>
          {model.state === "error" ? (
            <ErrorState
              description="The user could not be loaded."
              onRetry={onReload}
              title="Couldn't load this user"
            />
          ) : (
            <EmptyState
              className="m-6"
              description="The user may have been deleted, or the link is wrong."
              icon={<UsersIcon />}
              title="User not found"
            />
          )}
        </Card>
      </section>
    );
  }

  const { user } = model;
  const unavailable = !onAction;
  const describedBy = unavailable ? hintId : undefined;

  function request(intent: AdminUserIntent) {
    if (!onAction || pending) return;
    setConfirming(intent);
    setError(null);
    setOpen(true);
  }

  function cancel() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  async function submit(stepUp?: StepUpSubmission) {
    if (!onAction || !confirming || pending) return;
    setPending(true);
    setError(null);
    const outcome = await runAdminUserAction(onAction, {
      intent: confirming,
      ...(stepUp ? { stepUp } : {}),
    });
    setPending(false);
    if (outcome === "done") {
      setOpen(false);
      if (confirming.type === "assignRole") setSelectedRole("");
    } else {
      setError(USER_ACTION_FAILED);
    }
  }

  const accountAction = accountActionFor(user.accountStatus);
  const statusBadge = accountStatusBadge(user.accountStatus);
  const assignable =
    model.assignableRoles.state === "ready"
      ? rolesAvailableToAssign(model.assignableRoles.data, user.roles)
      : [];
  const roleToAssign = assignable.find((role) => role.id === selectedRole);

  return (
    <section className="space-y-6">
      <AdminDetailHeader
        actions={
          <>
            <Button
              aria-describedby={describedBy}
              disabled={unavailable}
              onClick={() => request({ type: "signOutAll" })}
              variant="secondary"
            >
              Sign out all sessions
            </Button>
            {accountAction ? (
              <Button
                aria-describedby={describedBy}
                data-intent={accountAction.type}
                disabled={unavailable}
                onClick={() => request(accountAction)}
                variant={
                  accountAction.type === "lock" ? "dangerOutline" : "primary"
                }
              >
                {accountAction.type === "lock"
                  ? "Lock account"
                  : "Unlock account"}
              </Button>
            ) : null}
          </>
        }
        back={back}
        badges={
          <>
            <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
            {user.emailConfirmed === true ? (
              <Badge tone="success">Email confirmed</Badge>
            ) : null}
            {user.emailConfirmed === false ? (
              <Badge tone="warning">Email not confirmed</Badge>
            ) : null}
          </>
        }
        leading={<Avatar decorative name={user.displayName} size="lg" />}
        meta={
          <>
            <span className="break-all">{user.email}</span>
            {" · ID "}
            <span className="font-mono break-all">{user.id}</span>
            {user.tenantName ? ` · Tenant: ${user.tenantName}` : null}
          </>
        }
        title={user.displayName}
      />
      {unavailable ? <UnavailableHint id={hintId} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-6">
          <TitledCard title="Account">
            <CardContent>
              <KeyValueList items={accountItems(user, dates)} />
            </CardContent>
          </TitledCard>

          <TitledCard title="Administrative roles">
            <CardContent className="grid gap-4">
              {user.roles.length === 0 ? (
                <p className="text-fg-muted">No administrative roles.</p>
              ) : (
                <ul
                  aria-label="Assigned roles"
                  className="flex flex-wrap gap-2"
                >
                  {user.roles.map((role) => (
                    <li key={role.id}>
                      <Chip
                        onRemove={
                          onAction
                            ? () => request({ role, type: "removeRole" })
                            : undefined
                        }
                        removeLabel={`Remove ${role.name}`}
                      >
                        {role.name}
                      </Chip>
                    </li>
                  ))}
                </ul>
              )}
              <AdminSectionBody
                label="assignable roles"
                section={model.assignableRoles}
              >
                {() =>
                  assignable.length === 0 ? (
                    <p className="text-small text-fg-muted">
                      No other roles to assign.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-end gap-3">
                      <FormField
                        className="min-w-[200px] flex-[1_1_200px]"
                        inputId={roleSelectId}
                        label="Role to assign"
                      >
                        <Select
                          aria-describedby={describedBy}
                          disabled={unavailable}
                          id={roleSelectId}
                          onChange={(event) =>
                            setSelectedRole(event.target.value)
                          }
                          value={roleToAssign ? roleToAssign.id : ""}
                        >
                          <option value="">Choose a role</option>
                          {assignable.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <Button
                        aria-describedby={describedBy}
                        disabled={unavailable || !roleToAssign}
                        onClick={() =>
                          roleToAssign
                            ? request({
                                role: roleToAssign,
                                type: "assignRole",
                              })
                            : undefined
                        }
                      >
                        Assign role
                      </Button>
                    </div>
                  )
                }
              </AdminSectionBody>
              {rolesHref ? (
                <Link
                  className="text-small text-brand-ink w-fit font-medium hover:underline"
                  href={rolesHref}
                >
                  Manage roles
                </Link>
              ) : null}
            </CardContent>
          </TitledCard>
        </div>

        <div className="grid content-start gap-6">
          <TitledCard title="KYC">
            <CardContent>
              <AdminSectionBody label="verification status" section={model.kyc}>
                {(kyc) => {
                  if (!kyc) {
                    return (
                      <p className="text-fg-muted">No verification yet.</p>
                    );
                  }
                  const badge = kycStatusBadge(kyc.status);
                  const started = formatAdminDateTime(kyc.startedAt, dates);
                  const details = [
                    kyc.attemptNumber ? `Attempt #${kyc.attemptNumber}` : null,
                    started ? `started ${started}` : null,
                  ].filter(Boolean);
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="grid gap-1">
                        <Badge className="w-fit" tone={badge.tone}>
                          {badge.label}
                        </Badge>
                        {details.length > 0 ? (
                          <p className="text-small text-fg-muted">
                            {details.join(" · ")}
                          </p>
                        ) : null}
                      </div>
                      {getKycHref && kyc.verificationId ? (
                        <Button asChild size="sm" variant="secondary">
                          <Link href={getKycHref(kyc.verificationId)}>
                            Open verification
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  );
                }}
              </AdminSectionBody>
            </CardContent>
          </TitledCard>

          <TitledCard title="Subscription">
            <CardContent>
              <AdminSectionBody
                label="subscription"
                section={model.subscription}
              >
                {(subscription) => {
                  if (!subscription) {
                    return <p className="text-fg-muted">No subscription.</p>;
                  }
                  const badge = subscriptionStatusBadge(subscription.status);
                  const renews = formatAdminDateTime(
                    subscription.renewsAt,
                    dates,
                  );
                  const details = [
                    renews ? `Renews ${renews}` : null,
                    subscription.autoRenew === undefined
                      ? null
                      : `auto-renew ${subscription.autoRenew ? "on" : "off"}`,
                  ].filter(Boolean);
                  return (
                    <div className="grid gap-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-fg font-semibold">
                          {subscription.planName}
                          {subscription.interval
                            ? ` · ${subscription.interval}`
                            : ""}
                        </span>
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </p>
                      {details.length > 0 ? (
                        <p className="text-small text-fg-muted">
                          {details.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  );
                }}
              </AdminSectionBody>
            </CardContent>
          </TitledCard>

          <TitledCard title="Active sessions">
            {model.sessions.state === "ready" ? (
              model.sessions.data.length === 0 ? (
                <CardContent>
                  <p className="text-fg-muted">No active sessions.</p>
                </CardContent>
              ) : (
                <ul aria-label="Active sessions">
                  {model.sessions.data.map((session) => {
                    const lastActive = formatAdminDateTime(
                      session.lastActiveAt,
                      dates,
                    );
                    const description = [
                      session.location,
                      session.current ? "active now" : lastActive,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <ListRow
                        actions={
                          <Button
                            aria-describedby={describedBy}
                            aria-label={`Revoke ${session.label}`}
                            disabled={unavailable}
                            onClick={() =>
                              request({ session, type: "revokeSession" })
                            }
                            size="sm"
                            variant="dangerOutline"
                          >
                            Revoke
                          </Button>
                        }
                        as="li"
                        description={description || undefined}
                        key={session.id}
                        leading={
                          <IconTile size="sm">
                            <MonitorIcon />
                          </IconTile>
                        }
                        title={session.label}
                      />
                    );
                  })}
                </ul>
              )
            ) : (
              <CardContent>
                <AdminSectionBody
                  label="active sessions"
                  onRetry={onReload}
                  section={model.sessions}
                >
                  {() => null}
                </AdminSectionBody>
              </CardContent>
            )}
          </TitledCard>
        </div>
      </div>

      <TitledCard title="Security activity">
        {model.activity.state === "unavailable" ? (
          <CardContent>
            <AdminSectionBody
              label="security activity"
              section={model.activity}
            >
              {() => null}
            </AdminSectionBody>
          </CardContent>
        ) : (
          <DataTable
            caption="Security activity"
            columns={activityColumns(dates)}
            emptyMessage="No security activity recorded."
            error={
              model.activity.state === "error" ? (
                <ErrorState
                  className="py-2"
                  description="Security activity could not be loaded."
                  onRetry={onReload}
                  title="Couldn't load security activity"
                />
              ) : undefined
            }
            keyField={(event) => event.id}
            loading={model.activity.state === "loading"}
            loadingLabel="Loading security activity"
            loadingRows={3}
            mobileLayout="stack"
            rows={model.activity.state === "ready" ? model.activity.data : []}
            variant="embedded"
          />
        )}
      </TitledCard>

      {confirming ? (
        <UserActionConfirmation
          error={error}
          intent={confirming}
          onCancel={cancel}
          onSubmit={(stepUp) => void submit(stepUp)}
          open={open}
          pending={pending}
          user={user}
        />
      ) : null}
    </section>
  );
}
