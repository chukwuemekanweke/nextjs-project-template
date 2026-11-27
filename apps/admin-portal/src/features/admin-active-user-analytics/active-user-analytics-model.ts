import type {
  AdminChartData,
  AdminListState,
  AdminMetric,
  AdminRangePreset,
  UtcDateRange,
} from "@/components/admin-patterns";

export type ActiveUserAnalyticsFilters = Readonly<{
  range: AdminRangePreset;
  selectedDate?: string;
}>;
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
  reportingRange?: UtcDateRange;
  metrics: Readonly<{
    dau: AdminMetric;
    wau: AdminMetric;
    mau: AdminMetric;
    stickiness: AdminMetric;
  }>;
  trend: AdminChartData;
  users: AdminListState<ActiveUserRow>;
}>;
