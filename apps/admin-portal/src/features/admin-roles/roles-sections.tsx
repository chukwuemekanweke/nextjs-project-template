import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  ArrowLeftIcon,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckIcon,
  Checkbox,
  DataTable,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  KeyValueList,
  ListRow,
  LoadingStatus,
  MinusIcon,
  PlusIcon,
  ShieldIcon,
  Skeleton,
  Textarea,
  type TableColumn,
} from "@template/ui-core";
import { Fragment, type ReactNode } from "react";
import { AdminForbidden } from "@/components/admin-patterns";
import {
  AdminSectionBody,
  UnavailableHint,
  formatAdminDateTime,
  type AdminDateOptions,
} from "@/features/admin-users/admin-view";
import {
  ROLE_EDITING_UNAVAILABLE,
  groupGrantCount,
  isPermissionGranted,
  permissionCountLabel,
  roleKindLabels,
  type AdminPermissionGroup,
  type AdminPermissionMatrix,
  type AdminRoleDetail,
  type AdminRoleEditModel,
  type AdminRoleSummary,
  type AdminRolesModel,
} from "./roles-model";

/*
 * Roles list, permission matrix and read-only role editor (reference
 * `AdminRoles*`, `AdminRoleEdit*`; Trello FE-UI-013). Visual compositions
 * only: there is no permission model or role API (DR-073), so nothing here
 * creates, edits, assigns or deletes anything, and a production role editor
 * is out of scope (CAF-FE-008). Every editing control is disabled with an
 * explanation. Typed preview data lives in `roles-preview.fixtures.ts` and
 * is used by tests only.
 */

const NEW_ROLE_HINT_ID = "admin-roles-new-hint";
const ROLE_EDIT_HINT_ID = "admin-role-edit-hint";

function Count({ value }: Readonly<{ value: string | undefined }>) {
  if (value === undefined) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not available</span>
      </>
    );
  }
  return <>{value}</>;
}

function roleColumns(
  totalPermissions: number | undefined,
  getRoleHref: ((roleId: string) => string) | undefined,
): readonly TableColumn<AdminRoleSummary>[] {
  const columns: TableColumn<AdminRoleSummary>[] = [
    {
      cell: (role) => (
        <span className="grid gap-0.5">
          <span className="text-fg font-semibold">{role.name}</span>
          {role.description ? (
            <span className="text-caption text-fg-subtle">
              {role.description}
            </span>
          ) : null}
        </span>
      ),
      header: "Role",
    },
    {
      cell: (role) => (
        <Badge tone={role.kind === "custom" ? "info" : "neutral"}>
          {roleKindLabels[role.kind]}
        </Badge>
      ),
      className: "whitespace-nowrap",
      header: "Type",
    },
    {
      cell: (role) => (
        <Count
          value={permissionCountLabel(role.permissionCount, totalPermissions)}
        />
      ),
      className: "whitespace-nowrap",
      header: "Permissions",
    },
    {
      cell: (role) => (
        <Count
          value={
            role.memberCount === undefined
              ? undefined
              : String(role.memberCount)
          }
        />
      ),
      header: "Members",
    },
  ];
  if (getRoleHref) {
    columns.push({
      align: "right",
      cell: (role) => (
        <Link
          aria-label={`View ${role.name}`}
          className="text-brand-ink font-medium hover:underline focus-visible:underline"
          href={getRoleHref(role.id)}
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
 * Read-only role × permission table (reference "Permission matrix"). Each
 * cell states "Granted" or "Not granted" in text; the marks are decorative.
 * The catalogue is whatever the source supplies — never a built-in list.
 */
export function PermissionMatrix({
  matrix,
}: Readonly<{ matrix: AdminPermissionMatrix }>) {
  if (matrix.groups.length === 0 || matrix.roles.length === 0) {
    return (
      <CardContent>
        <p className="text-fg-muted">No permissions reported.</p>
      </CardContent>
    );
  }
  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Permission matrix"
      tabIndex={0}
    >
      <table className="text-label w-full min-w-[640px] border-collapse font-normal">
        <caption className="sr-only">
          Permissions granted to each role (read-only)
        </caption>
        <thead>
          <tr>
            <th
              className="border-border bg-surface-2 text-caption text-fg-subtle border-b px-6 py-3 text-left font-semibold tracking-[0.04em] uppercase"
              scope="col"
            >
              Permission
            </th>
            {matrix.roles.map((role) => (
              <th
                className="border-border bg-surface-2 text-caption text-fg-subtle border-b px-3 py-3 text-center font-semibold tracking-[0.04em] uppercase"
                key={role.id}
                scope="col"
              >
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.groups.map((group) => (
            <Fragment key={group.id}>
              <tr>
                <th
                  className="border-border bg-surface-2 text-small text-fg border-b px-6 py-2 text-left font-semibold"
                  colSpan={matrix.roles.length + 1}
                  scope="colgroup"
                >
                  {group.label}
                </th>
              </tr>
              {group.permissions.map((permission) => (
                <tr key={permission.key}>
                  <th
                    className="border-border text-fg border-b px-6 py-3 text-left font-medium"
                    scope="row"
                  >
                    {permission.label}
                    <span className="text-caption text-fg-subtle block font-mono font-normal">
                      {permission.key}
                    </span>
                  </th>
                  {matrix.roles.map((role) => {
                    const granted = isPermissionGranted(
                      matrix,
                      role.id,
                      permission.key,
                    );
                    return (
                      <td
                        className="border-border border-b px-3 py-3 text-center"
                        data-granted={granted}
                        key={role.id}
                      >
                        {granted ? (
                          <CheckIcon
                            className="text-success inline"
                            size="sm"
                          />
                        ) : (
                          <MinusIcon
                            className="text-fg-subtle inline"
                            size="sm"
                          />
                        )}
                        <span className="sr-only">
                          {granted ? "Granted" : "Not granted"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Roles page body: header, roles table and the read-only permission
 * matrix. "New role" is disabled (no role-management API); role links
 * appear only with `getRoleHref`.
 */
export function AdminRolesScreen({
  getRoleHref,
  model,
  onReload,
}: Readonly<{
  getRoleHref?: (roleId: string) => string;
  model: AdminRolesModel;
  onReload?: () => void;
}>) {
  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.details}
        resourceLabel="Roles and permissions"
      />
    );
  }

  return (
    <section className="space-y-6">
      <DashboardHeader
        actions={
          <Button
            aria-describedby={NEW_ROLE_HINT_ID}
            disabled
            leadingIcon={<PlusIcon />}
          >
            New role
          </Button>
        }
        description="See what each admin role can do and who holds it."
        title="Roles & permissions"
      />
      <UnavailableHint id={NEW_ROLE_HINT_ID}>
        Creating and editing roles needs a role-management API.
      </UnavailableHint>
      <Card>
        <DataTable
          caption="Admin roles"
          columns={roleColumns(
            model.state === "ready" ? model.totalPermissions : undefined,
            getRoleHref,
          )}
          empty={
            <EmptyState
              className="border-0 py-2"
              icon={<ShieldIcon />}
              title="No roles reported"
            />
          }
          error={
            model.state === "error" ? (
              <ErrorState
                className="py-2"
                description="The roles could not be loaded."
                onRetry={onReload}
                title="Couldn't load roles"
              />
            ) : undefined
          }
          keyField={(role) => role.id}
          loading={model.state === "loading"}
          loadingLabel="Loading roles"
          loadingRows={4}
          mobileLayout="stack"
          rows={model.state === "ready" ? model.roles : []}
          variant="embedded"
        />
      </Card>
      {model.state === "ready" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Permission matrix</CardTitle>
              <CardDescription>
                Read-only overview of what the backend reports for each role.
              </CardDescription>
            </div>
          </CardHeader>
          {model.matrix.state === "ready" ? (
            <PermissionMatrix matrix={model.matrix.data} />
          ) : (
            <CardContent>
              <AdminSectionBody
                label="permission matrix"
                onRetry={onReload}
                section={model.matrix}
              >
                {() => null}
              </AdminSectionBody>
            </CardContent>
          )}
        </Card>
      ) : null}
      <Alert variant="info">
        System roles come with the platform. Which permissions each role grants
        is defined by the backend.
      </Alert>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Role editor (read-only visual composition)                                */
/* ------------------------------------------------------------------------ */

function PermissionGroupCard({
  granted,
  group,
}: Readonly<{ granted: readonly string[]; group: AdminPermissionGroup }>) {
  const count = groupGrantCount(group, granted);
  const keys = new Set(granted);
  return (
    <Card data-group={group.id}>
      <CardHeader>
        <CardTitle>{group.label}</CardTitle>
        <div className="flex items-center gap-2.5">
          <span className="text-small text-fg-muted">
            {count.granted} of {count.total}
          </span>
          <Button
            aria-describedby={ROLE_EDIT_HINT_ID}
            disabled
            size="sm"
            variant="ghost"
          >
            Select all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <fieldset className="grid gap-4" disabled>
          <legend className="sr-only">{group.label} permissions</legend>
          {group.permissions.map((permission) => (
            <Checkbox
              checked={keys.has(permission.key)}
              disabled
              description={
                <>
                  {permission.description ? (
                    <span className="block">{permission.description}</span>
                  ) : null}
                  <span className="font-mono">{permission.key}</span>
                </>
              }
              key={permission.key}
              label={permission.label}
              readOnly
            />
          ))}
        </fieldset>
      </CardContent>
    </Card>
  );
}

function roleMeta(
  role: AdminRoleDetail,
  memberCount: number | undefined,
  dates: AdminDateOptions | undefined,
): string {
  const changed = formatAdminDateTime(role.updatedAt, dates);
  const parts = [
    `${role.permissions.length} ${role.permissions.length === 1 ? "permission" : "permissions"}`,
    memberCount === undefined
      ? null
      : `${memberCount} ${memberCount === 1 ? "member" : "members"}`,
    changed
      ? `last changed ${changed}${role.updatedBy ? ` by ${role.updatedBy}` : ""}`
      : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

function EditorCard({
  children,
  title,
  trailing,
}: Readonly<{ children: ReactNode; title: string; trailing?: ReactNode }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {trailing}
      </CardHeader>
      {children}
    </Card>
  );
}

/**
 * Role editor layout (reference `AdminRoleEdit`) as a read-only, isolated
 * visual composition: details, grouped permission checklists, summary,
 * members and danger zone, all disabled. It reports nothing and persists
 * nothing; "Start from" and the removal-impact warning are omitted.
 */
export function AdminRoleEditScreen({
  dates,
  listHref,
  model,
  onReload,
}: Readonly<{
  dates?: AdminDateOptions;
  /** Implemented roles list route, for the back link. */
  listHref?: string;
  model: AdminRoleEditModel;
  onReload?: () => void;
}>) {
  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.details}
        resourceLabel="Role details"
      />
    );
  }

  const back = listHref ? (
    <Link
      className="text-small text-brand-ink inline-flex w-fit items-center gap-1.5 font-medium hover:underline"
      href={listHref}
    >
      <ArrowLeftIcon size="xs" />
      Roles &amp; permissions
    </Link>
  ) : null;

  if (model.state === "loading") {
    return (
      <section aria-busy="true" className="space-y-6">
        <LoadingStatus label="Loading role" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-40 w-full" />
      </section>
    );
  }
  if (model.state === "error" || model.state === "notFound") {
    return (
      <section className="space-y-6">
        {back}
        <Card>
          {model.state === "error" ? (
            <ErrorState
              description="The role could not be loaded."
              onRetry={onReload}
              title="Couldn't load this role"
            />
          ) : (
            <EmptyState
              className="m-6"
              icon={<ShieldIcon />}
              title="Role not found"
            />
          )}
        </Card>
      </section>
    );
  }

  const { role } = model;
  const memberCount =
    model.members.state === "ready" ? model.members.data.length : undefined;
  const totalPermissions =
    model.groups.state === "ready"
      ? model.groups.data.reduce(
          (sum, group) => sum + group.permissions.length,
          0,
        )
      : undefined;

  return (
    <section className="space-y-6">
      {back}
      <DashboardHeader
        actions={
          <>
            <Button
              aria-describedby={ROLE_EDIT_HINT_ID}
              disabled
              variant="ghost"
            >
              Cancel
            </Button>
            <Button aria-describedby={ROLE_EDIT_HINT_ID} disabled>
              Save changes
            </Button>
          </>
        }
        description={roleMeta(role, memberCount, dates)}
        eyebrow={`${roleKindLabels[role.kind]} role`}
        title={role.name}
      />
      <Alert id={ROLE_EDIT_HINT_ID} variant="info">
        {ROLE_EDITING_UNAVAILABLE}
        {role.kind === "system"
          ? " System roles come with the platform and can't be deleted."
          : null}
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <EditorCard title="Details">
            <CardContent className="grid gap-4">
              <FormField inputId="admin-role-name" label="Role name">
                <Input
                  aria-describedby={ROLE_EDIT_HINT_ID}
                  disabled
                  id="admin-role-name"
                  readOnly
                  value={role.name}
                />
              </FormField>
              <FormField inputId="admin-role-description" label="Description">
                <Textarea
                  aria-describedby={ROLE_EDIT_HINT_ID}
                  disabled
                  id="admin-role-description"
                  readOnly
                  rows={2}
                  value={role.description ?? ""}
                />
              </FormField>
            </CardContent>
          </EditorCard>
          {model.groups.state === "ready" ? (
            model.groups.data.map((group) => (
              <PermissionGroupCard
                granted={role.permissions}
                group={group}
                key={group.id}
              />
            ))
          ) : (
            <EditorCard title="Permissions">
              <CardContent>
                <AdminSectionBody
                  label="permissions"
                  onRetry={onReload}
                  section={model.groups}
                >
                  {() => null}
                </AdminSectionBody>
              </CardContent>
            </EditorCard>
          )}
        </div>

        <div className="grid content-start gap-6">
          <EditorCard title="Summary">
            <CardContent>
              <KeyValueList
                items={[
                  {
                    label: "Permissions",
                    value: (
                      <Count
                        value={permissionCountLabel(
                          role.permissions.length,
                          totalPermissions,
                        )}
                      />
                    ),
                  },
                  {
                    label: "Members",
                    value: (
                      <Count
                        value={
                          memberCount === undefined
                            ? undefined
                            : String(memberCount)
                        }
                      />
                    ),
                  },
                ]}
              />
            </CardContent>
          </EditorCard>

          <EditorCard
            title="Members"
            trailing={
              memberCount === undefined ? undefined : (
                <span className="text-small text-fg-muted">
                  {memberCount} {memberCount === 1 ? "person" : "people"}
                </span>
              )
            }
          >
            <CardContent className="border-border border-b py-3.5">
              <FormField inputId="admin-role-add-member" label="Add member">
                <Input
                  aria-describedby={ROLE_EDIT_HINT_ID}
                  disabled
                  id="admin-role-add-member"
                  placeholder="Name or email"
                />
              </FormField>
            </CardContent>
            {model.members.state === "ready" ? (
              model.members.data.length === 0 ? (
                <CardContent>
                  <p className="text-fg-muted">No members.</p>
                </CardContent>
              ) : (
                <ul aria-label="Role members">
                  {model.members.data.map((member) => (
                    <ListRow
                      actions={
                        <Button
                          aria-describedby={ROLE_EDIT_HINT_ID}
                          aria-label={`Remove ${member.displayName}`}
                          disabled
                          size="sm"
                          variant="dangerOutline"
                        >
                          Remove
                        </Button>
                      }
                      as="li"
                      description={member.email}
                      key={member.id}
                      leading={
                        <Avatar
                          decorative
                          name={member.displayName}
                          size="sm"
                        />
                      }
                      title={member.displayName}
                    />
                  ))}
                </ul>
              )
            ) : (
              <CardContent>
                <AdminSectionBody
                  label="members"
                  onRetry={onReload}
                  section={model.members}
                >
                  {() => null}
                </AdminSectionBody>
              </CardContent>
            )}
          </EditorCard>

          <EditorCard title="Danger zone">
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-[1_1_200px]">
                <p className="text-fg font-semibold">Delete role</p>
                <p className="text-small text-fg-muted">
                  {role.kind === "system"
                    ? "System roles can't be deleted."
                    : "Members would lose these permissions."}
                </p>
              </div>
              <Button
                aria-describedby={ROLE_EDIT_HINT_ID}
                disabled
                variant="danger"
              >
                Delete role
              </Button>
            </CardContent>
          </EditorCard>
        </div>
      </div>
    </section>
  );
}
