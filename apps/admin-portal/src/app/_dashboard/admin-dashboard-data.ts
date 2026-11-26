import type {
  AdminChartData,
  AdminMetric,
  AdminRangePreset,
  AdminSummaryData,
  UtcDateRange,
} from "@/components/admin-patterns";

/*
 * Data contract for the admin operations overview (reference
 * `AdminDashboard`). Each panel carries its own state so live reads can be
 * wired one at a time by the analytics/operations tickets.
 */

export type AdminDashboardData = Readonly<{
  period: Readonly<{
    preset: AdminRangePreset;
    /** UTC days the figures cover, when a source reports them. */
    range?: UtcDateRange;
    /** Why the period cannot be changed (no live source yet). */
    unavailableReason?: string;
  }>;
  kpis: Readonly<{
    totalUsers: AdminMetric;
    dailyActiveUsers: AdminMetric;
    paymentVolume: AdminMetric;
    recurringRevenue: AdminMetric;
  }>;
  registrations: AdminChartData;
  payments: AdminChartData;
  kycQueue: AdminSummaryData;
  subscriptionsNeedingAttention: AdminSummaryData;
  paymentProviders: AdminSummaryData;
}>;

const ANALYTICS_REASON = "Needs an admin analytics API.";

/**
 * What production renders today. The backend exposes no admin analytics,
 * KYC, subscription or provider-status reads (DR-070, DR-074), so every
 * panel is honestly unavailable: no sample figures, zeros or statuses.
 * Replace a field with a live read when its API exists.
 */
export const productionAdminDashboard: AdminDashboardData = {
  kpis: {
    dailyActiveUsers: { reason: ANALYTICS_REASON, state: "unavailable" },
    paymentVolume: { reason: ANALYTICS_REASON, state: "unavailable" },
    recurringRevenue: { reason: ANALYTICS_REASON, state: "unavailable" },
    totalUsers: { reason: ANALYTICS_REASON, state: "unavailable" },
  },
  kycQueue: {
    reason: "Needs a KYC verification queue API.",
    state: "unavailable",
  },
  paymentProviders: {
    reason: "Needs a payment provider status API.",
    state: "unavailable",
  },
  payments: {
    reason: "Payment analytics need an admin analytics API.",
    state: "unavailable",
  },
  period: {
    preset: "30d",
    unavailableReason: "Available once admin analytics are connected.",
  },
  registrations: {
    reason: "Registration analytics need an admin analytics API.",
    state: "unavailable",
  },
  subscriptionsNeedingAttention: {
    reason: "Needs an admin subscriptions API.",
    state: "unavailable",
  },
};
