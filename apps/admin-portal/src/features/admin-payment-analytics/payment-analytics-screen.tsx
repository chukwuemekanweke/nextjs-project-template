"use client";

import {
  CardContent,
  DataTable,
  EmptyState,
  formatMinorUnits,
  type TableColumn,
} from "@template/ui-core";
import {
  AnalyticsBreakdownCard,
  AnalyticsRangeControl,
  AnalyticsScreenLayout,
  AnalyticsSelect,
} from "../admin-analytics-shared/analytics-layout";
import type {
  PaymentAnalyticsFilters,
  PaymentAnalyticsModel,
  PaymentBreakdownRow,
} from "./payment-analytics-model";

const intervals = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
] as const;

export function PaymentAnalyticsScreen({
  filters,
  model,
  onFiltersChange,
}: Readonly<{
  filters: PaymentAnalyticsFilters;
  model: PaymentAnalyticsModel;
  onFiltersChange?: (filters: PaymentAnalyticsFilters) => void;
}>) {
  const update = onFiltersChange
    ? <K extends keyof PaymentAnalyticsFilters>(
        key: K,
        value: PaymentAnalyticsFilters[K],
      ) => onFiltersChange({ ...filters, [key]: value })
    : undefined;
  const reason =
    "Payment analytics filters require an authoritative admin aggregate API.";
  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.volumeTrend,
          id: "volume",
          kind: "bars",
          title: "Payment volume over time",
          formatValue: (value) => formatMinorUnits(value, filters.currency),
        },
        {
          data: model.statusBreakdown,
          id: "status",
          kind: "bars",
          title: "By status",
        },
      ]}
      description="Currency-scoped payment volume, outcomes and provider performance."
      filters={
        <>
          <AnalyticsRangeControl
            disabledReason={reason}
            onChange={update ? (value) => update("range", value) : undefined}
            range={model.reportingRange}
            value={filters.range}
          />
          <AnalyticsSelect
            disabledReason={reason}
            label="Interval"
            onChange={update ? (value) => update("interval", value) : undefined}
            options={intervals}
            value={filters.interval}
          />
          <AnalyticsSelect
            disabledReason={reason}
            label="Currency"
            onChange={update ? (value) => update("currency", value) : undefined}
            options={[
              {
                label: filters.currency || "Not available",
                value: filters.currency,
              },
            ]}
            value={filters.currency}
          />
          <AnalyticsSelect
            disabledReason={reason}
            label="Provider"
            onChange={update ? (value) => update("provider", value) : undefined}
            options={[
              { label: filters.provider || "All", value: filters.provider },
            ]}
            value={filters.provider}
          />
        </>
      }
      metrics={model.metrics}
      title="Payment analytics"
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Breakdown title="By provider" rows={model.providers} />
        <Breakdown title="By payment intent" rows={model.intents} />
      </div>
    </AnalyticsScreenLayout>
  );
}

function Breakdown({
  rows,
  title,
}: Readonly<{ rows: readonly PaymentBreakdownRow[] | null; title: string }>) {
  return (
    <AnalyticsBreakdownCard title={title}>
      {rows ? (
        <DataTable
          caption={title}
          columns={breakdownColumns}
          empty={<EmptyState title="No breakdown data" />}
          keyField={(row) => row.id}
          rows={rows}
          variant="embedded"
        />
      ) : (
        <CardContent>
          <p className="text-fg font-medium">Not available</p>
          <p className="text-small text-fg-muted">
            This breakdown is not reported by an admin analytics API yet.
          </p>
        </CardContent>
      )}
    </AnalyticsBreakdownCard>
  );
}
const breakdownColumns: readonly TableColumn<PaymentBreakdownRow>[] = [
  { header: "Name", cell: (row) => row.label },
  {
    header: "Count",
    align: "right",
    cell: (row) =>
      row.count === null ? "Not available" : row.count.toLocaleString("en-US"),
  },
  {
    header: "Volume",
    align: "right",
    cell: (row) =>
      row.amountMinor === null
        ? "Not available"
        : formatMinorUnits(row.amountMinor, row.currencyCode),
  },
  {
    header: "Success rate",
    align: "right",
    cell: (row) => row.successRate ?? "Not available",
  },
];
