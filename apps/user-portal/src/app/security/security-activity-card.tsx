"use client";

import type { SecurityActivityResponse } from "@template/api-client/authentication";
import { useSecurityActivity } from "@template/api-react/authentication";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DataTable,
  ErrorState,
  type TableColumn,
} from "@template/ui-core";
import {
  ActivityEventIcon,
  SECURITY_ACTIVITY_PAGE_SIZE,
  loadedActivities,
  securityActivityError,
} from "./activity-presentation";
import {
  describeActivityType,
  describeDevice,
  describeFailureReason,
  describeLocation,
  formatActivityTimestamp,
  ipAddressLookupUrl,
} from "./session-display";

const columns: readonly TableColumn<SecurityActivityResponse>[] = [
  {
    cell: (entry) => <ActivityEvent entry={entry} />,
    header: "Event",
  },
  { cell: (entry) => describeDevice(entry), header: "Device" },
  {
    cell: (entry) => describeLocation(entry) ?? "Unknown",
    header: "Location",
  },
  {
    cell: (entry) => (
      <a
        className="hover:text-brand-ink decoration-border-strong break-all underline decoration-dotted underline-offset-2"
        href={ipAddressLookupUrl(entry.ipAddress)}
        rel="noopener noreferrer"
        target="_blank"
      >
        {entry.ipAddress}
        <span className="sr-only"> (opens IP address lookup in a new tab)</span>
      </a>
    ),
    header: "IP address",
  },
  {
    cell: (entry) => (
      <time className="whitespace-nowrap" dateTime={entry.occurredAtUtc}>
        {formatActivityTimestamp(entry.occurredAtUtc)}
      </time>
    ),
    header: "When",
  },
];

/**
 * Activity tab (reference `UserSecurity-activity`): a table on wider
 * screens that stacks into labelled blocks on phones. The backend list is
 * cursor-paginated, so more rows are appended with "Load more"; rows already
 * loaded stay visible if a later page fails.
 */
export function SecurityActivityCard() {
  const activity = useSecurityActivity(SECURITY_ACTIVITY_PAGE_SIZE);
  const activities = loadedActivities(activity.data?.pages);
  const loadFailed = activity.isError && !activity.data;

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Security activity</CardTitle>
          <p className="text-small text-fg-muted mt-0.5">
            Sign-ins and security changes on your account, newest first.
          </p>
        </div>
      </CardHeader>
      {activity.isFetchNextPageError && activity.data ? (
        <CardContent className="pb-0 md:pb-0">
          <Alert variant="error">
            More security activity could not be loaded. Try again.
          </Alert>
        </CardContent>
      ) : null}
      <DataTable
        caption="Security activity"
        columns={columns}
        emptyMessage="No security activity has been recorded yet."
        error={
          loadFailed ? (
            <ErrorState
              description={securityActivityError(activity.error)}
              title="Security activity unavailable"
            />
          ) : undefined
        }
        keyField={(entry) => entry.id}
        loading={activity.isPending}
        loadingLabel="Loading security activity"
        loadingRows={4}
        mobileLayout="stack"
        rows={activities}
        variant="embedded"
      />
      {activity.hasNextPage && activities.length > 0 ? (
        <CardFooter className="justify-center">
          <Button
            loading={activity.isFetchingNextPage}
            onClick={() => void activity.fetchNextPage()}
            variant="secondary"
          >
            {activity.isFetchNextPageError
              ? "Try loading more again"
              : "Load more"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function ActivityEvent({
  entry,
}: Readonly<{ entry: SecurityActivityResponse }>) {
  const failureReason = describeFailureReason(entry.failureReason);
  const failed = entry.activityType === "FailedSignIn";

  return (
    <span className="flex items-start gap-3">
      <ActivityEventIcon activityType={entry.activityType} size="sm" />
      <span className="min-w-0">
        <span className="text-fg flex flex-wrap items-center gap-2 font-medium">
          {describeActivityType(entry.activityType)}
          {failed ? <Badge tone="danger">Failed</Badge> : null}
        </span>
        {failureReason ? (
          <span className="text-small text-danger mt-0.5 block">
            <span className="sr-only">Reason: </span>
            {failureReason}
          </span>
        ) : null}
      </span>
    </span>
  );
}
