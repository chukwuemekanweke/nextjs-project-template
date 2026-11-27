"use client";

import { formatMinorUnits } from "@template/ui-core";
import {
  AdminRangeFilter,
  adminOptionsUnavailableText,
  readyAdminOptions,
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
import type {
  SubscriptionAnalyticsFilters,
  SubscriptionAnalyticsModel,
} from "./subscription-analytics-model";

const DESCRIPTION =
  "Supplied subscription, recurring-revenue, lifecycle and renewal aggregates.";
const FILTERS_UNAVAILABLE =
  "Subscription analytics filters require an authoritative aggregate API.";

/**
 * Subscription analytics (reference `AdminSubscriptionAnalyticsPage`).
 * Screen-level states come from `state`; plan, owner and currency options
 * come from their own reads.
 */
export function SubscriptionAnalyticsScreen({
  currencyOptions,
  filters,
  onFiltersChange,
  onRetry,
  ownerOptions,
  planOptions,
  state,
}: Readonly<{
  currencyOptions?: AdminOptionsState;
  filters: SubscriptionAnalyticsFilters;
  onFiltersChange?: (filters: SubscriptionAnalyticsFilters) => void;
  onRetry?: () => void;
  ownerOptions?: AdminOptionsState;
  planOptions?: AdminOptionsState;
  state: AnalyticsScreenState<SubscriptionAnalyticsModel>;
}>) {
  return (
    <AnalyticsScreenStateBoundary
      description={DESCRIPTION}
      label="Subscription analytics"
      onRetry={onRetry}
      state={state}
      title="Subscription analytics"
    >
      {(model) => (
        <SubscriptionAnalyticsContent
          currencyOptions={currencyOptions}
          filters={filters}
          model={model}
          onFiltersChange={onFiltersChange}
          ownerOptions={ownerOptions}
          planOptions={planOptions}
        />
      )}
    </AnalyticsScreenStateBoundary>
  );
}

function SubscriptionAnalyticsContent({
  currencyOptions,
  filters,
  model,
  onFiltersChange,
  ownerOptions,
  planOptions,
}: Readonly<{
  currencyOptions?: AdminOptionsState;
  filters: SubscriptionAnalyticsFilters;
  model: SubscriptionAnalyticsModel;
  onFiltersChange?: (filters: SubscriptionAnalyticsFilters) => void;
  ownerOptions?: AdminOptionsState;
  planOptions?: AdminOptionsState;
}>) {
  const wired = Boolean(onFiltersChange);

  function changeRange(range: AdminRangePreset) {
    onFiltersChange?.({ ...filters, range });
  }

  function changePlan(plan: string) {
    onFiltersChange?.({ ...filters, plan });
  }

  function changeOwner(owner: string) {
    onFiltersChange?.({ ...filters, owner });
  }

  function changeCurrency(currency: string) {
    onFiltersChange?.({ ...filters, currency });
  }

  function optionsReason(
    options: AdminOptionsState | undefined,
    noun: string,
  ): string | undefined {
    return wired
      ? adminOptionsUnavailableText(options, noun)
      : FILTERS_UNAVAILABLE;
  }

  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.mrrTrend,
          description: `Amounts in ${model.reportedCurrencyCode}`,
          formatValue: (value) =>
            formatMinorUnits(value, model.reportedCurrencyCode),
          id: "mrr",
          kind: "line",
          title: "Monthly recurring revenue over time",
        },
        {
          data: model.lifecycleTrend,
          id: "lifecycle",
          kind: "bars",
          title: "New vs cancelled",
        },
        {
          data: model.renewalTrend,
          id: "renewals",
          kind: "bars",
          title: "Renewals · successful vs failed",
        },
        {
          data: model.planBreakdown,
          id: "plans",
          kind: "bars",
          title: "Active by plan",
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
            allLabel="All plans"
            disabledReason={optionsReason(planOptions, "Plans")}
            label="Plan"
            onChange={wired ? changePlan : undefined}
            options={readyAdminOptions(planOptions)}
            value={filters.plan}
          />
          <AnalyticsSelect
            allLabel="All owners"
            disabledReason={optionsReason(ownerOptions, "Owners")}
            label="Owner"
            onChange={wired ? changeOwner : undefined}
            options={readyAdminOptions(ownerOptions)}
            value={filters.owner}
          />
          <AnalyticsSelect
            disabledReason={optionsReason(currencyOptions, "Currencies")}
            label="Currency"
            onChange={wired ? changeCurrency : undefined}
            options={readyAdminOptions(currencyOptions)}
            value={filters.currency}
          />
        </>
      }
      metrics={model.metrics}
      title="Subscription analytics"
    />
  );
}
