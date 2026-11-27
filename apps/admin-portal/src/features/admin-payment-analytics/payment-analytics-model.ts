import type {
  AdminChartData,
  AdminMetric,
  AdminRangePreset,
  UtcDateRange,
} from "@/components/admin-patterns";

export type PaymentAnalyticsFilters = Readonly<{
  range: AdminRangePreset;
  interval: "day" | "week" | "month";
  currency: string;
  provider: string;
}>;
export type PaymentBreakdownRow = Readonly<{
  id: string;
  label: string;
  count: number | null;
  amountMinor: number | string | null;
  currencyCode: string;
  successRate: string | null;
}>;
export type PaymentAnalyticsModel = Readonly<{
  reportingRange?: UtcDateRange;
  metrics: readonly Readonly<{
    id: string;
    label: string;
    metric: AdminMetric;
  }>[];
  volumeTrend: AdminChartData;
  statusBreakdown: AdminChartData;
  providers: readonly PaymentBreakdownRow[] | null;
  intents: readonly PaymentBreakdownRow[] | null;
}>;
