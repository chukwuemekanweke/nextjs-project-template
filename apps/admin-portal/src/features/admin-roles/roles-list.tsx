import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  ErrorState,
  PlusIcon,
  ShieldIcon,
  type TableColumn,
} from "@template/ui-core";
import {
  AdminForbidden,
  AdminNotAvailable,
  AdminSectionBody,
  AdminUnavailableHint,
} from "@/components/admin-patterns";
import { PermissionMatrix } from "./permission-matrix";
import {
  permissionCountLabel,
  roleKindLabels,
  type AdminRoleSummary,
  type AdminRolesModel,
} from "./roles-model";

/*
 * Roles list and read-only permission matrix (reference `AdminRoles*`;
 * Trello FE-UI-013). There is no permission model or role API (DR-073), so
 * nothing here creates, edits or assigns anything. Typed preview data lives
 * in `roles-preview.fixtures.ts` and is used by tests only.
 */

const NEW_ROLE_HINT_ID = "admin-roles-new-hint";

/** A reported count, or "Not available" (never 0) when unreported. */
export function RoleCount({ value }: Readonly<{ value: string | undefined }>) {
  if (value === undefined) {
    return <AdminNotAvailable />;
  }
  return <>{value}</>;
}

function memberCountLabel(count: number | undefined): string | undefined {
  return count === undefined ? undefined : String(count);
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
        <RoleCount
          value={permissionCountLabel(role.permissionCount, totalPermissions)}
        />
      ),
      className: "whitespace-nowrap",
      header: "Permissions",
    },
    {
      cell: (role) => <RoleCount value={memberCountLabel(role.memberCount)} />,
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
        requestDetails={model.requestDetails}
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
      <AdminUnavailableHint id={NEW_ROLE_HINT_ID}>
        Creating and editing roles needs a role-management API.
      </AdminUnavailableHint>
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
                description={model.message ?? "The roles could not be loaded."}
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
