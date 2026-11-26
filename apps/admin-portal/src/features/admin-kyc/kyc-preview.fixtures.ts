import { countMetric } from "@/components/admin-patterns";
import type {
  AdminKycDetailRecord,
  AdminKycListItem,
  AdminKycListModel,
  AdminKycStatus,
} from "./kyc-model";

/*
 * PREVIEW ONLY. Typed, deterministic, synthetic fixtures for the KYC list
 * and detail compositions, used by tests (the isolated harness for ADM-KYC /
 * ADM-KYC-DETAIL). Fixed timestamps; "Fixture provider" instead of a real
 * provider; no reference sample people or counts. Production modules must
 * never import this file (enforced by the boundary test).
 */

export const FIXTURE_PROVIDER = "Fixture provider";

export const fixtureProviderOptions = [
  { label: FIXTURE_PROVIDER, value: "fixture-provider" },
];

function item(
  index: number,
  status: AdminKycStatus,
  overrides: Partial<AdminKycListItem> = {},
): AdminKycListItem {
  const day = String(10 + index).padStart(2, "0");
  return {
    completedAt: undefined,
    id: `vrf-fixture-${String(index).padStart(4, "0")}`,
    provider: FIXTURE_PROVIDER,
    providerReference: `ref_fixture_${index}`,
    startedAt: `2026-01-${day}T10:32:00Z`,
    status,
    submittedAt: undefined,
    user: {
      displayName: `Fixture User ${index}`,
      email: `user${index}@fixture.test`,
      id: `usr-fixture-${String(index).padStart(4, "0")}`,
    },
    ...overrides,
  };
}

export const fixtureKycItems: readonly AdminKycListItem[] = [
  item(1, "pending", { submittedAt: "2026-01-11T10:41:00Z" }),
  item(2, "inProgress"),
  item(3, "verified", {
    completedAt: "2026-01-13T10:50:00Z",
    submittedAt: "2026-01-13T10:41:00Z",
  }),
  item(4, "rejected", { completedAt: "2026-01-14T12:30:00Z" }),
  item(5, "expired", { completedAt: "2026-01-16T10:32:00Z" }),
  item(6, "failed", { completedAt: "2026-01-16T10:40:00Z" }),
  item(7, "unknown", { provider: undefined, providerReference: undefined }),
];

export const fixtureKycListModel: AdminKycListModel = {
  counts: {
    inProgress: countMetric(1),
    pending: countMetric(1),
    rejectedOrFailed: countMetric(0),
    verified: countMetric(null),
  },
  verifications: {
    page: 1,
    pageSize: 10,
    rows: fixtureKycItems,
    state: "ready",
    totalItems: fixtureKycItems.length,
    totalPages: 1,
  },
};

export function fixtureKycDetailRecord(
  status: AdminKycStatus = "pending",
): AdminKycDetailRecord {
  return {
    attempts: {
      data: [
        {
          attemptNumber: 3,
          id: "att-3",
          startedAt: "2026-01-18T10:32:00Z",
          status,
        },
        {
          attemptNumber: 2,
          completedAt: "2026-01-15T12:00:00Z",
          id: "att-2",
          startedAt: "2026-01-15T10:00:00Z",
          status: "rejected",
        },
        {
          attemptNumber: 1,
          completedAt: "2026-01-12T10:00:00Z",
          id: "att-1",
          startedAt: "2026-01-11T10:00:00Z",
          status: "expired",
        },
      ],
      state: "ready",
    },
    history: {
      data: [
        {
          detail: "signature valid",
          id: "h-4",
          label: "Callback received · pending",
          occurredAt: "2026-01-18T10:41:00Z",
        },
        {
          id: "h-3",
          label: "Form completed by user",
          occurredAt: "2026-01-18T10:41:00Z",
        },
        {
          id: "h-2",
          label: "Status → In progress",
          occurredAt: "2026-01-18T10:33:00Z",
        },
        { id: "h-1", label: "Hosted form session created" },
      ],
      state: "ready",
    },
    verification: {
      applicantId: "app_fixture_19",
      attemptCount: 3,
      attemptNumber: 3,
      id: "vrf-fixture-0001",
      provider: FIXTURE_PROVIDER,
      providerReference: "ref_fixture_1",
      providerStatus: "Pending review",
      startedAt: "2026-01-18T10:32:00Z",
      status,
      submittedAt: "2026-01-18T10:41:00Z",
      user: {
        country: "Fixture Country",
        displayName: "Blake Fixture",
        email: "blake@fixture.test",
        id: "usr-fixture-0002",
      },
    },
  };
}
