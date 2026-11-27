"use client";

import { formatMinorUnits } from "@template/ui-core";
import {
  AnalyticsRangeControl,
  AnalyticsScreenLayout,
  AnalyticsSelect,
} from "../admin-analytics-shared/analytics-layout";
import type {
  SubscriptionAnalyticsFilters,
  SubscriptionAnalyticsModel,
} from "./subscription-analytics-model";

export function SubscriptionAnalyticsScreen({
  filters,
  model,
  onFiltersChange,
}: Readonly<{
  filters: SubscriptionAnalyticsFilters;
  model: SubscriptionAnalyticsModel;
  onFiltersChange?: (filters: SubscriptionAnalyticsFilters) => void;
}>) {
  const update = onFiltersChange
    ? <K extends keyof SubscriptionAnalyticsFilters>(
        key: K,
        value: SubscriptionAnalyticsFilters[K],
      ) => onFiltersChange({ ...filters, [key]: value })
    : undefined;
  const reason =
    "Subscription analytics filters require an authoritative aggregate API.";
  const one = (label: string, value: string) => [
    { label: value || "All", value },
  ];
  return (
    <AnalyticsScreenLayout
      charts={[
        {
          data: model.mrrTrend,
          formatValue: (value) => formatMinorUnits(value, filters.currency),
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
      description="Supplied subscription, recurring-revenue, lifecycle and renewal aggregates."
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
            label="Plan"
            onChange={update ? (value) => update("plan", value) : undefined}
            options={one("Plan", filters.plan)}
            value={filters.plan}
          />
          <AnalyticsSelect
            disabledReason={reason}
            label="Owner"
            onChange={update ? (value) => update("owner", value) : undefined}
            options={one("Owner", filters.owner)}
            value={filters.owner}
          />
          <AnalyticsSelect
            disabledReason={reason}
            label="Currency"
            onChange={update ? (value) => update("currency", value) : undefined}
            options={one("Currency", filters.currency)}
            value={filters.currency}
          />
        </>
      }
      metrics={model.metrics}
      title="Subscription analytics"
    />
  );
}
