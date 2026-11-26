import type {
  AdminListState,
  AdminOptionsState,
} from "../admin-billing-shared/billing-model";
import type {
  AdminSubscriptionDetail,
  AdminSubscriptionRow,
} from "./subscriptions-model";

/*
 * PREVIEW ONLY. Deterministic fixtures for the admin subscriptions list,
 * detail and allocation screens, used by tests (there is no route).
 * Production modules must never import this file or fall back to it;
 * `subscriptions-screens.test.tsx` enforces it.
 */

export function fixtureSubscriptionRow(
  index: number,
  overrides: Partial<AdminSubscriptionRow> = {},
): AdminSubscriptionRow {
  const day = String(10 + index).padStart(2, "0");
  return {
    autoRenew: true,
    cancelAtPeriodEnd: false,
    currentPeriodEndUtc: `2026-02-${day}T00:00:00Z`,
    id: `sub-fixture-${index}`,
    lifecycleStatus: "Active",
    nextBillingAtUtc: `2026-02-${day}T00:00:00Z`,
    ownerDisplayName: `Fixture User ${index}`,
    ownerId: `user-fixture-${index}`,
    ownerSecondary: `user${index}@fixture.test`,
    ownerType: "Stakeholder",
    planCode: "FIXTURE_STANDARD",
    planName: "Fixture Standard",
    tenantName: "Fixture Tenant",
    ...overrides,
  };
}

export const fixtureSubscriptionRows: readonly AdminSubscriptionRow[] = [
  fixtureSubscriptionRow(1),
  fixtureSubscriptionRow(2, { cancelAtPeriodEnd: true }),
  fixtureSubscriptionRow(3, {
    lifecycleStatus: "PastDue",
    ownerDisplayName: "Fixture Tenant Org",
    ownerSecondary: null,
    ownerType: "Tenant",
  }),
  fixtureSubscriptionRow(4, {
    autoRenew: null,
    lifecycleStatus: "Expired",
    nextBillingAtUtc: null,
    tenantName: null,
  }),
  fixtureSubscriptionRow(5, { lifecycleStatus: "Paused" }),
];

export function fixtureSubscriptionList(
  rows: readonly AdminSubscriptionRow[] = fixtureSubscriptionRows,
): AdminListState<AdminSubscriptionRow> {
  return {
    page: 1,
    pageSize: 20,
    rows,
    state: "ready",
    totalItems: rows.length,
    totalPages: 1,
  };
}

export function fixtureSubscriptionDetail(
  overrides: Partial<AdminSubscriptionDetail> = {},
): AdminSubscriptionDetail {
  return {
    ...fixtureSubscriptionRow(1),
    billingInterval: "Monthly",
    currencyCode: "NGN",
    currentPeriodStartUtc: "2026-01-11T00:00:00Z",
    fulfillmentStatus: "Fulfilled",
    lifetimePaid: { amount: 4_500_000, currencyCode: "NGN", paymentCount: 3 },
    payments: [
      {
        amount: 1_500_000,
        createdAtUtc: "2026-01-11T06:00:00Z",
        currencyCode: "NGN",
        id: "p-3",
        kind: "Renewal",
        merchantReference: "FIX-SUB-0003",
        paymentStatus: "Succeeded",
      },
      {
        amount: 1_500_000,
        createdAtUtc: "2025-12-11T06:00:00Z",
        currencyCode: "NGN",
        id: "p-2",
        kind: "Renewal",
        merchantReference: "FIX-SUB-0002",
        paymentStatus: "Failed",
      },
    ],
    planPrice: 1_500_000,
    savedPaymentMethod: null,
    source: { kind: "purchase", providerName: "Fixture Provider" },
    startedAtUtc: "2025-11-11T00:00:00Z",
    statusHistory: [
      {
        atUtc: "2026-01-11T06:00:00Z",
        id: "s-2",
        label: "Renewed",
        source: "System",
      },
      {
        atUtc: "2025-11-11T00:00:00Z",
        id: "s-1",
        label: "Activated after payment",
        source: "Provider webhook",
      },
    ],
    ...overrides,
  };
}

const ready = (
  options: readonly { label: string; value: string }[],
): AdminOptionsState => ({ options, state: "ready" });

export const fixtureTenantOptions = ready([
  { label: "Fixture Tenant", value: "tenant-1" },
  { label: "Fixture Tenant Two", value: "tenant-2" },
]);
export const fixturePlanOptions = ready([
  { label: "Fixture Standard", value: "plan-standard" },
  { label: "Fixture Premium", value: "plan-premium" },
]);
export const fixtureDurationOptions = ready([
  { label: "1 month", value: "P1M" },
  { label: "3 months", value: "P3M" },
]);
export const fixtureUserResults = ready([
  { label: "Fixture User 1 · user1@fixture.test", value: "user-1" },
]);
