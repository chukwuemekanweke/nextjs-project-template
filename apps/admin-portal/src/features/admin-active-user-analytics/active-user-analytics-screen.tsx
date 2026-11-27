"use client";

import Link from "next/link";
import { Avatar, CardContent, type TableColumn } from "@template/ui-core";
import {
  AdminForbidden,
  AdminListPager,
  AdminListTable,
  formatAdminDateTime,
} from "@/components/admin-patterns";
import {
  AnalyticsBreakdownCard,
  AnalyticsRangeControl,
  AnalyticsScreenLayout,
} from "../admin-analytics-shared/analytics-layout";
import type {
  ActiveUserAnalyticsFilters,
  ActiveUserAnalyticsModel,
  ActiveUserRow,
} from "./active-user-analytics-model";

export function ActiveUserAnalyticsScreen({
  filters,
  model,
  onFiltersChange,
  onPageChange,
}: Readonly<{
  filters: ActiveUserAnalyticsFilters;
  model: ActiveUserAnalyticsModel;
  onFiltersChange?: (filters: ActiveUserAnalyticsFilters) => void;
  onPageChange?: (page: number) => void;
}>) {
  if (model.users.state === "forbidden")
    return <AdminForbidden resourceLabel="Active-user analytics" />;
  const selected = filters.selectedDate
    ? `Active on ${filters.selectedDate} (UTC)`
    : "Active users in selected period";
  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.trend,
          id: "active-users",
          kind: "line",
          title: "Daily active users",
        },
      ]}
      description="Daily, weekly and monthly qualifying activity. Token refresh is not counted as activity."
      filters={
        <AnalyticsRangeControl
          disabledReason="Activity filters require the admin analytics API."
          onChange={
            onFiltersChange
              ? (range) => onFiltersChange({ ...filters, range })
              : undefined
          }
          range={model.reportingRange}
          value={filters.range}
        />
      }
      metrics={[
        { id: "dau", label: "Daily active users", metric: model.metrics.dau },
        { id: "wau", label: "Weekly active users", metric: model.metrics.wau },
        { id: "mau", label: "Monthly active users", metric: model.metrics.mau },
        {
          id: "stickiness",
          label: "DAU / MAU stickiness",
          metric: model.metrics.stickiness,
        },
      ]}
      title="Active users"
    >
      <AnalyticsBreakdownCard title={selected}>
        <AdminListTable
          caption="Active users"
          columns={activeColumns}
          emptyTitle="No active users in this period"
          keyField={(row) => row.id}
          loadingLabel="Loading active users"
          onPageChange={onPageChange}
          state={model.users}
        />
        <CardContent className="border-border border-t">
          <AdminListPager
            label="Active-user pages"
            onPageChange={onPageChange}
            state={model.users}
          />
        </CardContent>
      </AnalyticsBreakdownCard>
    </AnalyticsScreenLayout>
  );
}

const activeColumns: readonly TableColumn<ActiveUserRow>[] = [
  {
    header: "User",
    cell: (row) => (
      <div className="flex items-center gap-3">
        <Avatar decorative name={row.fullName} size="sm" src={row.avatarUrl} />
        <div>
          <p className="text-fg font-medium">{row.fullName}</p>
          <p className="text-small text-fg-muted">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    header: "First activity",
    cell: (row) => <Utc value={row.firstActivityAtUtc} />,
  },
  {
    header: "Last activity",
    cell: (row) => <Utc value={row.lastActivityAtUtc} />,
  },
  {
    header: "Activity",
    align: "right",
    cell: (row) => row.activityCount.toLocaleString("en-US"),
  },
  {
    header: "Last login",
    cell: (row) =>
      row.lastLoginAtUtc ? (
        <Utc value={row.lastLoginAtUtc} />
      ) : (
        <span className="text-fg-subtle">Never</span>
      ),
  },
  {
    header: "Actions",
    align: "right",
    cell: (row) =>
      row.detailHref ? (
        <Link
          className="text-brand-ink font-medium hover:underline"
          href={row.detailHref}
        >
          Details
        </Link>
      ) : (
        <span className="text-fg-subtle">Unavailable</span>
      ),
  },
];
function Utc({ value }: Readonly<{ value: string }>) {
  const text = formatAdminDateTime(value);
  return text ? (
    <time dateTime={value}>{text}</time>
  ) : (
    <span className="text-fg-subtle">Not available</span>
  );
}
