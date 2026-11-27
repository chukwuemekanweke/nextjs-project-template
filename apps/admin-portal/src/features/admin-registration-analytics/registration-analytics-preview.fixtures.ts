import { countMetric } from "@/components/admin-patterns";
import type { RegistrationAnalyticsModel } from "./registration-analytics-model";

export const registrationAnalyticsPreview: RegistrationAnalyticsModel = {
  metrics: {
    month: countMetric(128),
    today: countMetric(7),
    total: countMetric(12_480),
    week: countMetric(34),
  },
  reportingRange: { end: "2026-11-25", start: "2026-10-27" },
  trend: {
    categories: ["21 Nov", "22 Nov", "23 Nov", "24 Nov", "25 Nov"],
    series: [
      { label: "Registrations", series: 1, values: [12, 18, null, 26, 21] },
    ],
    state: "ready",
    summary: "Registrations rose from 12 to 21, with one unreported day.",
  },
  users: {
    page: 1,
    pageSize: 20,
    rows: [
      {
        avatarUrl: null,
        email: "amara.fixture@example.test",
        fullName: "Amara Fixture",
        id: "fixture-user-1",
        lastLoginAtUtc: null,
        signedUpAtUtc: "2026-11-24T18:40:00Z",
      },
    ],
    state: "ready",
    totalItems: 1,
    totalPages: 1,
  },
};
