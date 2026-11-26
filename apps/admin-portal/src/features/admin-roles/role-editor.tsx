import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  ArrowLeftIcon,
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
  Input,
  KeyValueList,
  ListRow,
  Textarea,
} from "@template/ui-core";
import type { ReactNode } from "react";
import {
  AdminDetailFallback,
  AdminSectionBody,
  formatAdminDateTime,
  type AdminSection,
} from "@/components/admin-patterns";
import { RoleCount } from "./roles-list";
import {
  ROLE_EDITING_UNAVAILABLE,
  groupGrantCount,
  permissionCountLabel,
  roleKindLabels,
  type AdminPermissionGroup,
  type AdminRoleDetail,
  type AdminRoleEditModel,
  type AdminRoleMember,
} from "./roles-model";

/*
 * Role editor layout (reference `AdminRoleEdit*`; Trello FE-UI-013) as a
 * read-only, isolated visual composition: every control is disabled with an
 * explanation, there is no form, no intent and no persistence (CAF-FE-008
 * prohibits a production role editor; DR-073, DR-123).
 */

const ROLE_EDIT_HINT_ID = "admin-role-edit-hint";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function roleMeta(
  role: AdminRoleDetail,
  memberCount: number | undefined,
): string {
  const parts = [plural(role.permissions.length, "permission", "permissions")];
  if (memberCount !== undefined) {
    parts.push(plural(memberCount, "member", "members"));
  }
  const changed = formatAdminDateTime(role.updatedAt);
  if (changed) {
    const by = role.updatedBy ? ` by ${role.updatedBy}` : "";
    parts.push(`last changed ${changed}${by}`);
  }
  return parts.join(" · ");
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
              description={
                <>
                  {permission.description ? (
                    <span className="block">{permission.description}</span>
                  ) : null}
                  <span className="font-mono">{permission.key}</span>
                </>
              }
              disabled
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

function RoleDetailsCard({ role }: Readonly<{ role: AdminRoleDetail }>) {
  return (
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
  );
}

function RolePermissions({
  groups,
  onReload,
  role,
}: Readonly<{
  groups: AdminSection<readonly AdminPermissionGroup[]>;
  onReload?: () => void;
  role: AdminRoleDetail;
}>) {
  if (groups.state === "ready") {
    return (
      <>
        {groups.data.map((group) => (
          <PermissionGroupCard
            granted={role.permissions}
            group={group}
            key={group.id}
          />
        ))}
      </>
    );
  }
  return (
    <EditorCard title="Permissions">
      <CardContent>
        <AdminSectionBody
          label="permissions"
          onRetry={onReload}
          section={groups}
        >
          {() => null}
        </AdminSectionBody>
      </CardContent>
    </EditorCard>
  );
}

function RoleMembersCard({
  memberCount,
  members,
  onReload,
}: Readonly<{
  memberCount: number | undefined;
  members: AdminSection<readonly AdminRoleMember[]>;
  onReload?: () => void;
}>) {
  let list: ReactNode;
  if (members.state !== "ready") {
    list = (
      <CardContent>
        <AdminSectionBody label="members" onRetry={onReload} section={members}>
          {() => null}
        </AdminSectionBody>
      </CardContent>
    );
  } else if (members.data.length === 0) {
    list = (
      <CardContent>
        <p className="text-fg-muted">No members.</p>
      </CardContent>
    );
  } else {
    list = (
      <ul aria-label="Role members">
        {members.data.map((member) => (
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
            leading={<Avatar decorative name={member.displayName} size="sm" />}
            title={member.displayName}
          />
        ))}
      </ul>
    );
  }

  return (
    <EditorCard
      title="Members"
      trailing={
        memberCount === undefined ? undefined : (
          <span className="text-small text-fg-muted">
            {plural(memberCount, "person", "people")}
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
      {list}
    </EditorCard>
  );
}

function DangerZoneCard({ role }: Readonly<{ role: AdminRoleDetail }>) {
  return (
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
        <Button aria-describedby={ROLE_EDIT_HINT_ID} disabled variant="danger">
          Delete role
        </Button>
      </CardContent>
    </EditorCard>
  );
}

/**
 * Role editor page body: details, grouped permission checklists, summary,
 * members and danger zone, all disabled. "Start from" and the
 * removal-impact warning are omitted.
 */
export function AdminRoleEditScreen({
  listHref,
  model,
  onReload,
}: Readonly<{
  /** Implemented roles list route, for the back link. */
  listHref?: string;
  model: AdminRoleEditModel;
  onReload?: () => void;
}>) {
  const back = listHref ? (
    <Link
      className="text-small text-brand-ink inline-flex w-fit items-center gap-1.5 font-medium hover:underline"
      href={listHref}
    >
      <ArrowLeftIcon size="xs" />
      Roles &amp; permissions
    </Link>
  ) : null;

  if (model.state !== "ready") {
    return (
      <section className="space-y-6">
        {model.state === "forbidden" ? null : back}
        <AdminDetailFallback
          onRetry={onReload}
          resourceLabel="Role"
          state={model}
        />
      </section>
    );
  }

  const { groups, members, role } = model.record;
  const memberCount =
    members.state === "ready" ? members.data.length : undefined;
  let totalPermissions: number | undefined;
  if (groups.state === "ready") {
    totalPermissions = groups.data.reduce(
      (sum, group) => sum + group.permissions.length,
      0,
    );
  }

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
        description={roleMeta(role, memberCount)}
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
          <RoleDetailsCard role={role} />
          <RolePermissions groups={groups} onReload={onReload} role={role} />
        </div>

        <div className="grid content-start gap-6">
          <EditorCard title="Summary">
            <CardContent>
              <KeyValueList
                items={[
                  {
                    label: "Permissions",
                    value: (
                      <RoleCount
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
                      <RoleCount
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
          <RoleMembersCard
            memberCount={memberCount}
            members={members}
            onReload={onReload}
          />
          <DangerZoneCard role={role} />
        </div>
      </div>
    </section>
  );
}
