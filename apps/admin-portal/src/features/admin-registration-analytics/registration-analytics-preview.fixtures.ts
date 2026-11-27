import { countMetric } from "@/components/admin-patterns";
import type {
  RegistrationAnalyticsModel,
  RegistrationPeriod,
} from "./registration-analytics-model";

const day = (label: string, date: string): RegistrationPeriod => ({
  label,
  range: { end: date, start: date },
});

const periods = [
  day("21 Nov", "2026-11-21"),
  day("22 Nov", "2026-11-22"),
  day("23 Nov", "2026-11-23"),
  day("24 Nov", "2026-11-24"),
  day("25 Nov", "2026-11-25"),
];

export const registrationAnalyticsPreview: RegistrationAnalyticsModel = {
  metrics: {
    month: countMetric(128),
    today: countMetric(7),
    total: countMetric(12_480),
    week: countMetric(34),
  },
  periods,
  reportingRange: { end: "2026-11-25", start: "2026-10-27" },
  trend: {
    categories: periods.map((period) => period.label),
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
