"use client";

import {
  CardContent,
  DataTable,
  EmptyState,
  formatMinorUnits,
  type TableColumn,
} from "@template/ui-core";
import {
  AdminListCard,
  AdminRangeFilter,
  adminOptionsUnavailableText,
  readyAdminOptions,
  type AdminOption,
  type AdminOptionsState,
  type AdminRangePreset,
} from "@/components/admin-patterns";
import {
  AnalyticsScreenLayout,
  AnalyticsScreenStateBoundary,
  AnalyticsSelect,
  type AnalyticsScreenState,
} from "../admin-analytics-shared/analytics-layout";
import { ReportedCurrencyNotice } from "../admin-analytics-shared/reported-currency-notice";
import {
  parsePaymentInterval,
  type PaymentAnalyticsFilters,
  type PaymentAnalyticsModel,
  type PaymentBreakdownRow,
} from "./payment-analytics-model";

const intervalOptions: readonly AdminOption[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

const DESCRIPTION =
  "Currency-scoped payment volume, outcomes and provider performance.";
const FILTERS_UNAVAILABLE =
  "Payment analytics filters require an authoritative admin aggregate API.";

/**
 * Payment analytics (reference `AdminPaymentAnalyticsPage`). Screen-level
 * loading, error, unavailable and forbidden states come from `state`;
 * currency and provider options come from their own reads.
 */
export function PaymentAnalyticsScreen({
  currencyOptions,
  filters,
  onFiltersChange,
  onRetry,
  providerOptions,
  state,
}: Readonly<{
  currencyOptions?: AdminOptionsState;
  filters: PaymentAnalyticsFilters;
  onFiltersChange?: (filters: PaymentAnalyticsFilters) => void;
  onRetry?: () => void;
  providerOptions?: AdminOptionsState;
  state: AnalyticsScreenState<PaymentAnalyticsModel>;
}>) {
  return (
    <AnalyticsScreenStateBoundary
      description={DESCRIPTION}
      label="Payment analytics"
      onRetry={onRetry}
      state={state}
      title="Payment analytics"
    >
      {(model) => (
        <PaymentAnalyticsContent
          currencyOptions={currencyOptions}
          filters={filters}
          model={model}
          onFiltersChange={onFiltersChange}
          providerOptions={providerOptions}
        />
      )}
    </AnalyticsScreenStateBoundary>
  );
}

function PaymentAnalyticsContent({
  currencyOptions,
  filters,
  model,
  onFiltersChange,
  providerOptions,
}: Readonly<{
  currencyOptions?: AdminOptionsState;
  filters: PaymentAnalyticsFilters;
  model: PaymentAnalyticsModel;
  onFiltersChange?: (filters: PaymentAnalyticsFilters) => void;
  providerOptions?: AdminOptionsState;
}>) {
  const wired = Boolean(onFiltersChange);

  function changeRange(range: AdminRangePreset) {
    onFiltersChange?.({ ...filters, range });
  }

  function changeInterval(value: string) {
    const interval = parsePaymentInterval(value);
    if (interval) {
      onFiltersChange?.({ ...filters, interval });
    }
  }

  function changeCurrency(currency: string) {
    onFiltersChange?.({ ...filters, currency });
  }

  function changeProvider(provider: string) {
    onFiltersChange?.({ ...filters, provider });
  }

  // Figures are formatted in the currency they were reported in, never in
  // a newly selected filter value that has not loaded yet.
  const formatAmount = (value: number) =>
    formatMinorUnits(value, model.reportedCurrencyCode);

  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.volumeTrend,
          description: `Amounts in ${model.reportedCurrencyCode}`,
          formatValue: formatAmount,
          id: "volume",
          kind: "bars",
          title: "Payment volume over time",
        },
        {
          data: model.statusBreakdown,
          id: "status",
          kind: "bars",
          title: "By status",
        },
      ]}
      description={DESCRIPTION}
      filterNotice={
        <ReportedCurrencyNotice
          reportedCurrencyCode={model.reportedCurrencyCode}
          requestedCurrencyCode={filters.currency}
        />
      }
      filters={
        <>
          <AdminRangeFilter
            disabledReason={FILTERS_UNAVAILABLE}
            onChange={wired ? changeRange : undefined}
            range={model.reportingRange}
            value={filters.range}
          />
          <AnalyticsSelect
            disabledReason={wired ? undefined : FILTERS_UNAVAILABLE}
            label="Interval"
            onChange={wired ? changeInterval : undefined}
            options={intervalOptions}
            value={filters.interval}
          />
          <AnalyticsSelect
            disabledReason={
              wired
                ? adminOptionsUnavailableText(currencyOptions, "Currencies")
                : FILTERS_UNAVAILABLE
            }
            label="Currency"
            onChange={wired ? changeCurrency : undefined}
            options={readyAdminOptions(currencyOptions)}
            value={filters.currency}
          />
          <AnalyticsSelect
            allLabel="All providers"
            disabledReason={
              wired
                ? adminOptionsUnavailableText(providerOptions, "Providers")
                : FILTERS_UNAVAILABLE
            }
            label="Provider"
            onChange={wired ? changeProvider : undefined}
            options={readyAdminOptions(providerOptions)}
            value={filters.provider}
          />
        </>
      }
      metrics={model.metrics}
      title="Payment analytics"
    >
      {/* min-w-0 + grid-cols-1: tables scroll in their region on phones. */}
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <Breakdown rows={model.providers} title="By provider" />
        <Breakdown rows={model.intents} title="By payment intent" />
      </div>
    </AnalyticsScreenLayout>
  );
}

function Breakdown({
  rows,
  title,
}: Readonly<{ rows: readonly PaymentBreakdownRow[] | null; title: string }>) {
  return (
    <AdminListCard title={title}>
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
    </AdminListCard>
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
