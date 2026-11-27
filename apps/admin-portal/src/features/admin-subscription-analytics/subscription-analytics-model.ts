import type {
  AdminChartData,
  AdminMetric,
  AdminRangePreset,
  UtcDateRange,
} from "@/components/admin-patterns";
export type SubscriptionAnalyticsFilters = Readonly<{
  range: AdminRangePreset;
  plan: string;
  owner: string;
  currency: string;
}>;
export type SubscriptionAnalyticsModel = Readonly<{
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
