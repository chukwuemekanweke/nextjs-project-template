"use client";

import Link from "next/link";
import {
  Avatar,
  CardContent,
  SearchInput,
  type TableColumn,
} from "@template/ui-core";
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
  AnalyticsSelect,
} from "../admin-analytics-shared/analytics-layout";
import type {
  RegistrationAnalyticsFilters,
  RegistrationAnalyticsModel,
  RegistrationUser,
} from "./registration-analytics-model";

const granularities = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
] as const;

export function RegistrationAnalyticsScreen({
  filters,
  model,
  onFiltersChange,
  onPageChange,
}: Readonly<{
  filters: RegistrationAnalyticsFilters;
  model: RegistrationAnalyticsModel;
  onFiltersChange?: (filters: RegistrationAnalyticsFilters) => void;
  onPageChange?: (page: number) => void;
}>) {
  if (model.users.state === "forbidden") {
    return <AdminForbidden resourceLabel="Registration analytics" />;
  }
  const unavailable =
    "Analytics filters become available with the admin analytics API.";
  const metrics = [
    {
      id: "total",
      label: "Total registered users",
      metric: model.metrics.total,
    },
    { id: "today", label: "New today", metric: model.metrics.today },
    { id: "week", label: "New this week", metric: model.metrics.week },
    { id: "month", label: "New this month", metric: model.metrics.month },
  ];
  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.trend,
          id: "registrations",
          kind: "line",
          title: "New registrations",
        },
      ]}
      description="Registration growth and the users behind it. Reporting dates use UTC."
      filters={
        <>
          <AnalyticsRangeControl
            disabledReason={unavailable}
            onChange={
              onFiltersChange
                ? (range) => onFiltersChange({ ...filters, range })
                : undefined
            }
            range={model.reportingRange}
            value={filters.range}
          />
          <AnalyticsSelect
            disabledReason={unavailable}
            label="Granularity"
            onChange={
              onFiltersChange
                ? (granularity) => onFiltersChange({ ...filters, granularity })
                : undefined
            }
            options={granularities}
            value={filters.granularity}
          />
        </>
      }
      metrics={metrics}
      title="Registrations"
    >
      <AnalyticsBreakdownCard title="Users registered in period">
        <CardContent className="border-border border-b py-3">
          <SearchInput
            disabled
            placeholder="Search users"
            aria-label="Search registered users"
          />
        </CardContent>
        <AdminListTable
          caption="Registered users"
          columns={registrationColumns}
          emptyTitle="No registrations in this period"
          keyField={(row) => row.id}
          loadingLabel="Loading registered users"
          onPageChange={onPageChange}
          state={model.users}
        />
        <div className="border-border border-t p-4">
          <AdminListPager
            label="Registration pages"
            onPageChange={onPageChange}
            state={model.users}
          />
        </div>
      </AnalyticsBreakdownCard>
    </AnalyticsScreenLayout>
  );
}

const registrationColumns: readonly TableColumn<RegistrationUser>[] = [
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
    header: "Signed up",
    cell: (row) => <UtcValue value={row.signedUpAtUtc} />,
  },
  {
    header: "Last login",
    cell: (row) =>
      row.lastLoginAtUtc ? (
        <UtcValue value={row.lastLoginAtUtc} />
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

function UtcValue({ value }: Readonly<{ value: string }>) {
  const formatted = formatAdminDateTime(value);
  return formatted ? (
    <time dateTime={value}>{formatted}</time>
  ) : (
    <span className="text-fg-subtle">Not available</span>
  );
}
