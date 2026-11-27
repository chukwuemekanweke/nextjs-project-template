import type {
  AdminChartData,
  AdminListState,
  AdminMetric,
  AdminRangePreset,
  UtcDateRange,
} from "@/components/admin-patterns";

export type RegistrationGranularity = "day" | "week" | "month" | "year";

export type RegistrationAnalyticsFilters = Readonly<{
  range: AdminRangePreset;
  granularity: RegistrationGranularity;
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
  reportingRange?: UtcDateRange;
  metrics: Readonly<{
    total: AdminMetric;
    today: AdminMetric;
    week: AdminMetric;
    month: AdminMetric;
  }>;
  trend: AdminChartData;
  users: AdminListState<RegistrationUser>;
}>;
