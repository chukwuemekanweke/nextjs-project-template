import { countMetric, moneyMetric } from "@/components/admin-patterns";
import type { SubscriptionAnalyticsModel } from "./subscription-analytics-model";

const chart = (title: string, values: readonly number[]) => ({
  categories: ["Sep", "Oct", "Nov"],
  series: [{ label: title, series: 1 as const, values }],
  state: "ready" as const,
  summary: `${title} for September through November.`,
});
export const subscriptionAnalyticsPreview: SubscriptionAnalyticsModel = {
  lifecycleTrend: {
    categories: ["Sep", "Oct", "Nov"],
    series: [
      { label: "New", series: 1, values: [42, 51, 63] },
      { label: "Cancelled", series: 2, values: [7, 9, 8] },
    ],
    state: "ready",
    summary: "New subscriptions exceeded cancellations in each month.",
  },
  metrics: [
    { id: "active", label: "Active subscriptions", metric: countMetric(1_284) },
    {
      id: "mrr",
      label: "Monthly recurring revenue",
      metric: moneyMetric(18_400_000, "NGN"),
    },
    { id: "churn", label: "Churn", metric: { state: "ready", value: "1.8%" } },
    {
      id: "growth",
      label: "Growth",
      metric: {
        delta: { label: "+6.1%", trend: "up" },
        state: "ready",
        value: "6.1%",
      },
    },
  ],
  mrrTrend: chart("MRR", [14_800_000, 16_300_000, 18_400_000]),
  planBreakdown: chart("Active subscriptions", [480, 526, 278]),
  renewalTrend: {
    categories: ["Sep", "Oct", "Nov"],
    series: [
      { label: "Successful", series: 1, values: [201, 228, 246] },
      { label: "Failed", series: 3, values: [11, 9, 13] },
    ],
    state: "ready",
    summary: "Successful renewals exceeded failed renewals.",
  },
  reportingRange: { end: "2026-11-25", start: "2026-10-27" },
};
