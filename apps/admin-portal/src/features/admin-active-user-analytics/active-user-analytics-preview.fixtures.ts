import { countMetric } from "@/components/admin-patterns";
import type { ActiveUserAnalyticsModel } from "./active-user-analytics-model";

export const activeUserAnalyticsPreview: ActiveUserAnalyticsModel = {
  metrics: {
    dau: {
      delta: { label: "+4.2%", trend: "up" },
      state: "ready",
      value: "842",
    },
    mau: countMetric(7_430),
    stickiness: { state: "ready", value: "11.3%", context: "DAU / MAU" },
    wau: countMetric(3_210),
  },
  reportingRange: { end: "2026-11-25", start: "2026-11-19" },
  trend: {
    categories: [
      "19 Nov",
      "20 Nov",
      "21 Nov",
      "22 Nov",
      "23 Nov",
      "24 Nov",
      "25 Nov",
    ],
    series: [
      {
        label: "Active users",
        series: 1,
        values: [711, 734, 760, 792, 801, 818, 842],
      },
    ],
    state: "ready",
    summary: "Daily active users increased from 711 to 842.",
  },
  users: {
    page: 1,
    pageSize: 20,
    rows: [
      {
        activityCount: 14,
        avatarUrl: null,
        email: "tobi.fixture@example.test",
        firstActivityAtUtc: "2026-11-24T07:10:00Z",
        fullName: "Tobi Fixture",
        id: "fixture-active-1",
        lastActivityAtUtc: "2026-11-24T18:55:00Z",
        lastLoginAtUtc: "2026-11-24T07:05:00Z",
      },
    ],
    state: "ready",
    totalItems: 1,
    totalPages: 1,
  },
};
