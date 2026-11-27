import type {
  AdminChartData,
  AdminMetric,
  AdminRangePreset,
  UtcDateRange,
} from "@/components/admin-patterns";

export const PAYMENT_INTERVALS = ["day", "week", "month"] as const;
export type PaymentInterval = (typeof PAYMENT_INTERVALS)[number];

export type PaymentAnalyticsFilters = Readonly<{
  range: AdminRangePreset;
  interval: PaymentInterval;
  /** Requested ISO 4217 currency; figures are never mixed across currencies. */
  currency: string;
  /** Provider id, or "" for all providers. */
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
  /**
   * Currency the figures were reported in. It labels the data even while a
   * different `filters.currency` is still loading.
   */
  reportedCurrencyCode: string;
  reportingRange?: UtcDateRange;
  metrics: readonly Readonly<{
    id: string;
    label: string;
    metric: AdminMetric;
  }>[];
  volumeTrend: AdminChartData;
  statusBreakdown: AdminChartData;
  /** `null` when no source reports the breakdown (not an empty list). */
  providers: readonly PaymentBreakdownRow[] | null;
  intents: readonly PaymentBreakdownRow[] | null;
}>;

export function parsePaymentInterval(
  value: string,
): PaymentInterval | undefined {
  return PAYMENT_INTERVALS.find((item) => item === value);
}
