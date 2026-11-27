import type {
  AdminChartData,
  AdminListState,
  AdminMetric,
  AdminReportingRange,
  UtcDateRange,
} from "@/components/admin-patterns";

export type ActiveUserAnalyticsFilters = Readonly<{
  range: AdminReportingRange;
  /** Used when `range` is "custom": inclusive UTC calendar dates. */
  customRange: UtcDateRange;
  /** UTC calendar date ("2026-11-24") whose active users are listed, or `null`. */
  selectedDate: string | null;
}>;

/** One chart category: its label and the UTC calendar date it covers. */
export type ActiveUserDay = Readonly<{ label: string; date: string }>;

export type ActiveUserRow = Readonly<{
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  firstActivityAtUtc: string;
  lastActivityAtUtc: string;
  activityCount: number;
  lastLoginAtUtc: string | null;
  detailHref?: string;
}>;

export type ActiveUserAnalyticsModel = Readonly<{
  /** The UTC days the figures cover, as reported by the source. */
  reportingRange?: UtcDateRange;
  metrics: Readonly<{
    dau: AdminMetric;
    wau: AdminMetric;
    mau: AdminMetric;
    stickiness: AdminMetric;
  }>;
  /** Chart categories are the `days` labels, in the same order. */
  trend: AdminChartData;
  days: readonly ActiveUserDay[];
  users: AdminListState<ActiveUserRow>;
}>;
