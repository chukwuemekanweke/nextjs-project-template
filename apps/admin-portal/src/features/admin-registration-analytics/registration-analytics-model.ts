import type {
  AdminChartData,
  AdminListState,
  AdminMetric,
  AdminReportingRange,
  UtcDateRange,
} from "@/components/admin-patterns";

export const REGISTRATION_GRANULARITIES = [
  "day",
  "week",
  "month",
  "year",
] as const;
export type RegistrationGranularity =
  (typeof REGISTRATION_GRANULARITIES)[number];

export type RegistrationAnalyticsFilters = Readonly<{
  range: AdminReportingRange;
  /** Used when `range` is "custom": inclusive UTC calendar dates. */
  customRange: UtcDateRange;
  granularity: RegistrationGranularity;
  query: string;
  /** The chart period whose users the table lists; `null` for the whole range. */
  selectedPeriod: UtcDateRange | null;
}>;

/** One chart category: its label and the UTC days it covers. */
export type RegistrationPeriod = Readonly<{
  label: string;
  range: UtcDateRange;
}>;

export type RegistrationUser = Readonly<{
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  signedUpAtUtc: string;
  lastLoginAtUtc: string | null;
  detailHref?: string;
}>;

export type RegistrationAnalyticsModel = Readonly<{
  /** The UTC days the figures cover, as reported by the source. */
  reportingRange?: UtcDateRange;
  metrics: Readonly<{
    total: AdminMetric;
    today: AdminMetric;
    week: AdminMetric;
    month: AdminMetric;
  }>;
  /** Chart categories are the `periods` labels, in the same order. */
  trend: AdminChartData;
  periods: readonly RegistrationPeriod[];
  users: AdminListState<RegistrationUser>;
}>;

export function parseRegistrationGranularity(
  value: string,
): RegistrationGranularity | undefined {
  return REGISTRATION_GRANULARITIES.find((item) => item === value);
}

export function isSameUtcRange(
  left: UtcDateRange | null,
  right: UtcDateRange | null,
): boolean {
  return left?.start === right?.start && left?.end === right?.end;
}
