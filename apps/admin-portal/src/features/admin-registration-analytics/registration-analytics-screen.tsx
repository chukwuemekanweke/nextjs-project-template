"use client";

import Link from "next/link";
import { Avatar, type TableColumn } from "@template/ui-core";
import {
  AdminDateTime,
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  AdminSearchFilter,
  formatUtcRange,
  type AdminOption,
} from "@/components/admin-patterns";
import {
  AnalyticsReportingPeriodFields,
  AnalyticsScreenLayout,
  AnalyticsSelect,
  type AnalyticsReportingPeriod,
} from "../admin-analytics-shared/analytics-layout";
import {
  isSameUtcRange,
  parseRegistrationGranularity,
  type RegistrationAnalyticsFilters,
  type RegistrationAnalyticsModel,
  type RegistrationUser,
} from "./registration-analytics-model";

const granularityOptions: readonly AdminOption[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

const FILTERS_UNAVAILABLE =
  "Registration filters become available with the admin analytics API.";

/**
 * Registration analytics (reference `AdminRegistrationsPage`). Controlled:
 * filters, the selected chart period and the page are owned by the caller,
 * which loads the matching users. Changing the range or granularity clears
 * the selected period, since the chart periods change with them.
 */
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
    return (
      <AdminForbidden
        permission={model.users.permission}
        requestDetails={model.users.requestDetails}
        resourceLabel="Registration analytics"
      />
    );
  }

  const selectedPeriod = model.periods.find((period) =>
    isSameUtcRange(period.range, filters.selectedPeriod),
  );

  function changePeriod(period: AnalyticsReportingPeriod) {
    onFiltersChange?.({ ...filters, ...period, selectedPeriod: null });
  }

  function changeGranularity(value: string) {
    const granularity = parseRegistrationGranularity(value);
    if (granularity) {
      onFiltersChange?.({ ...filters, granularity, selectedPeriod: null });
    }
  }

  function selectChartPeriod(label: string | null) {
    const period = model.periods.find((item) => item.label === label);
    onFiltersChange?.({ ...filters, selectedPeriod: period?.range ?? null });
  }

  function changeQuery(query: string) {
    onFiltersChange?.({ ...filters, query });
  }

  const wired = Boolean(onFiltersChange);
  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.trend,
          id: "registrations",
          kind: "line",
          selection: {
            disabledReason: FILTERS_UNAVAILABLE,
            label: "Registration period",
            onSelect: wired ? selectChartPeriod : undefined,
            selected: selectedPeriod?.label ?? null,
          },
          title: "New registrations",
        },
      ]}
      description="Registration growth and the users behind it. Reporting dates use UTC."
      filters={
        <>
          <AnalyticsReportingPeriodFields
            disabledReason={FILTERS_UNAVAILABLE}
            onChange={wired ? changePeriod : undefined}
            reportedRange={model.reportingRange}
            value={{ customRange: filters.customRange, range: filters.range }}
          />
          <AnalyticsSelect
            disabledReason={wired ? undefined : FILTERS_UNAVAILABLE}
            label="Granularity"
            onChange={wired ? changeGranularity : undefined}
            options={granularityOptions}
            value={filters.granularity}
          />
        </>
      }
      metrics={[
        {
          id: "total",
          label: "Total registered users",
          metric: model.metrics.total,
        },
        { id: "today", label: "New today", metric: model.metrics.today },
        { id: "week", label: "New this week", metric: model.metrics.week },
        { id: "month", label: "New this month", metric: model.metrics.month },
      ]}
      title="Registrations"
    >
      <AdminListCard
        footer={
          <AdminListPager
            label="Registration pages"
            onPageChange={onPageChange}
            state={model.users}
          />
        }
        title={
          filters.selectedPeriod
            ? `Users registered ${formatUtcRange(filters.selectedPeriod)}`
            : "Users registered in the reporting period"
        }
        toolbar={
          <AdminSearchFilter
            disabledReason={FILTERS_UNAVAILABLE}
            label="Search registered users"
            onChange={wired ? changeQuery : undefined}
            placeholder="Name or email"
            value={filters.query}
          />
        }
      >
        <AdminListTable
          caption="Registered users"
          columns={registrationColumns}
          emptyTitle="No registrations in this period"
          keyField={(row) => row.id}
          loadingLabel="Loading registered users"
          onPageChange={onPageChange}
          state={model.users}
        />
      </AdminListCard>
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
    cell: (row) => <AdminDateTime value={row.signedUpAtUtc} />,
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
