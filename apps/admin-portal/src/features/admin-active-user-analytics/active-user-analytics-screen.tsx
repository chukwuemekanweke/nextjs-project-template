"use client";

import Link from "next/link";
import { Avatar, type TableColumn } from "@template/ui-core";
import {
  AdminDateTime,
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  formatAdminDate,
} from "@/components/admin-patterns";
import {
  AnalyticsReportingPeriodFields,
  AnalyticsScreenLayout,
  type AnalyticsReportingPeriod,
} from "../admin-analytics-shared/analytics-layout";
import type {
  ActiveUserAnalyticsFilters,
  ActiveUserAnalyticsModel,
  ActiveUserRow,
} from "./active-user-analytics-model";

const FILTERS_UNAVAILABLE =
  "Activity filters become available with the admin analytics API.";

/**
 * Active-user analytics (reference `AdminActiveUsersPage`). Controlled: the
 * reporting period and the selected chart date are owned by the caller,
 * which loads that day's active users. Changing the period clears the date.
 */
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
  if (model.users.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.users.permission}
        requestDetails={model.users.requestDetails}
        resourceLabel="Active-user analytics"
      />
    );
  }

  const selectedDay = model.days.find(
    (day) => day.date === filters.selectedDate,
  );

  function changePeriod(period: AnalyticsReportingPeriod) {
    onFiltersChange?.({ ...filters, ...period, selectedDate: null });
  }

  function selectChartDate(label: string | null) {
    const day = model.days.find((item) => item.label === label);
    onFiltersChange?.({ ...filters, selectedDate: day?.date ?? null });
  }

  const wired = Boolean(onFiltersChange);
  const selectedDateLabel = formatAdminDate(filters.selectedDate);
  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.trend,
          id: "active-users",
          kind: "line",
          selection: {
            disabledReason: FILTERS_UNAVAILABLE,
            label: "Activity date",
            onSelect: wired ? selectChartDate : undefined,
            selected: selectedDay?.label ?? null,
          },
          title: "Daily active users",
        },
      ]}
      description="Daily, weekly and monthly qualifying activity. Token refresh is not counted as activity."
      filters={
        <AnalyticsReportingPeriodFields
          disabledReason={FILTERS_UNAVAILABLE}
          onChange={wired ? changePeriod : undefined}
          reportedRange={model.reportingRange}
          value={{ customRange: filters.customRange, range: filters.range }}
        />
      }
      metrics={[
        { id: "dau", label: "Daily active users", metric: model.metrics.dau },
        { id: "wau", label: "Weekly active users", metric: model.metrics.wau },
        {
          id: "mau",
          label: "Monthly active users",
          metric: model.metrics.mau,
        },
        {
          id: "stickiness",
          label: "DAU / MAU stickiness",
          metric: model.metrics.stickiness,
        },
      ]}
      title="Active users"
    >
      <AdminListCard
        footer={
          <AdminListPager
            label="Active-user pages"
            onPageChange={onPageChange}
            state={model.users}
          />
        }
        title={
          selectedDateLabel
            ? `Active on ${selectedDateLabel} (UTC)`
            : "Active users in the reporting period"
        }
      >
        <AdminListTable
          caption="Active users"
          columns={activeColumns}
          emptyTitle="No active users in this period"
          keyField={(row) => row.id}
          loadingLabel="Loading active users"
          onPageChange={onPageChange}
          state={model.users}
        />
      </AdminListCard>
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
    cell: (row) => <AdminDateTime value={row.firstActivityAtUtc} />,
  },
  {
    header: "Last activity",
    cell: (row) => <AdminDateTime value={row.lastActivityAtUtc} />,
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
        <AdminDateTime value={row.lastLoginAtUtc} />
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
