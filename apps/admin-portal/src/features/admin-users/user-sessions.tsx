"use client";

import {
  Button,
  CardContent,
  DataTable,
  ErrorState,
  IconTile,
  ListRow,
  MonitorIcon,
  type TableColumn,
} from "@template/ui-core";
import {
  AdminDateTime,
  AdminNotAvailable,
  AdminSectionBody,
  formatAdminDateTime,
  type AdminSection,
} from "@/components/admin-patterns";
import { TitledCard } from "./user-summary-cards";
import type { AdminSecurityEvent, AdminUserSession } from "./users-model";

/* Active sessions and security activity of the user detail screen. */

function sessionDescription(session: AdminUserSession): string | undefined {
  const activity = session.current
    ? "active now"
    : formatAdminDateTime(session.lastActiveAt);
  const parts = [session.location, activity].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Sessions with a per-session Revoke reported to `onRevoke`. */
export function UserSessionsCard({
  describedBy,
  onReload,
  onRevoke,
  sessions,
}: Readonly<{
  describedBy?: string;
  onReload?: () => void;
  onRevoke?: (session: AdminUserSession) => void;
  sessions: AdminSection<readonly AdminUserSession[]>;
}>) {
  if (sessions.state !== "ready") {
    return (
      <TitledCard title="Active sessions">
        <CardContent>
          <AdminSectionBody
            label="active sessions"
            onRetry={onReload}
            section={sessions}
          >
            {() => null}
          </AdminSectionBody>
        </CardContent>
      </TitledCard>
    );
  }

  if (sessions.data.length === 0) {
    return (
      <TitledCard title="Active sessions">
        <CardContent>
          <p className="text-fg-muted">No active sessions.</p>
        </CardContent>
      </TitledCard>
    );
  }

  return (
    <TitledCard title="Active sessions">
      <ul aria-label="Active sessions">
        {sessions.data.map((session) => (
          <ListRow
            actions={
              <Button
                aria-describedby={describedBy}
                aria-label={`Revoke ${session.label}`}
                disabled={!onRevoke}
                onClick={() => onRevoke?.(session)}
                size="sm"
                variant="dangerOutline"
              >
                Revoke
              </Button>
            }
            as="li"
            description={sessionDescription(session)}
            key={session.id}
            leading={
              <IconTile size="sm">
                <MonitorIcon />
              </IconTile>
            }
            title={session.label}
          />
        ))}
      </ul>
    </TitledCard>
  );
}

function optionalText(value: string | undefined) {
  return value ?? <AdminNotAvailable />;
}

const activityColumns: readonly TableColumn<AdminSecurityEvent>[] = [
  {
    cell: (event) => (
      <span className="text-fg font-semibold">{event.event}</span>
    ),
    header: "Event",
  },
  { cell: (event) => optionalText(event.device), header: "Device" },
  { cell: (event) => optionalText(event.location), header: "Location" },
  {
    cell: (event) => <AdminDateTime value={event.occurredAt} />,
    className: "whitespace-nowrap",
    header: "When",
  },
];

export function UserSecurityActivityCard({
  activity,
  onReload,
}: Readonly<{
  activity: AdminSection<readonly AdminSecurityEvent[]>;
  onReload?: () => void;
}>) {
  if (activity.state === "unavailable") {
    return (
      <TitledCard title="Security activity">
        <CardContent>
          <AdminSectionBody label="security activity" section={activity}>
            {() => null}
          </AdminSectionBody>
        </CardContent>
      </TitledCard>
    );
  }

  return (
    <TitledCard title="Security activity">
      <DataTable
        caption="Security activity"
        columns={activityColumns}
        emptyMessage="No security activity recorded."
        error={
          activity.state === "error" ? (
            <ErrorState
              className="py-2"
              description="Security activity could not be loaded."
              onRetry={onReload}
              title="Couldn't load security activity"
            />
          ) : undefined
        }
        keyField={(event) => event.id}
        loading={activity.state === "loading"}
        loadingLabel="Loading security activity"
        loadingRows={3}
        mobileLayout="stack"
        rows={activity.state === "ready" ? activity.data : []}
        variant="embedded"
      />
    </TitledCard>
  );
}
