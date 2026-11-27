import type {
  AdminChartData,
  AdminMetric,
  AdminRangePreset,
  UtcDateRange,
} from "@/components/admin-patterns";

export type SubscriptionAnalyticsFilters = Readonly<{
  range: AdminRangePreset;
  /** Plan id, or "" for all plans. */
  plan: string;
  /** Owner type, or "" for all owners. */
  owner: string;
  /** Requested ISO 4217 currency; revenue is never mixed across currencies. */
  currency: string;
}>;

export type SubscriptionAnalyticsModel = Readonly<{
  /** Currency the revenue figures were reported in (labels stale data too). */
  reportedCurrencyCode: string;
  reportingRange?: UtcDateRange;
  metrics: readonly Readonly<{
    id: string;
    label: string;
    metric: AdminMetric;
  }>[];
  mrrTrend: AdminChartData;
  lifecycleTrend: AdminChartData;
  renewalTrend: AdminChartData;
  planBreakdown: AdminChartData;
}>;
