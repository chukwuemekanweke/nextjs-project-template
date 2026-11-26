import type { AdminListState } from "../admin-billing-shared/billing-model";
import type { AdminPaymentDetail, AdminPaymentRow } from "./payments-model";

/*
 * PREVIEW ONLY. Deterministic fixtures for the admin payments screens, used
 * by tests (the preview harness; there is no route). Fixed timestamps,
 * obviously synthetic names and references. Production modules must never
 * import this file, use it as a fallback for a failed request or expose it
 * behind a toggle; `payments-screens.test.tsx` enforces the import rule.
 */

export function fixturePaymentRow(
  index: number,
  overrides: Partial<AdminPaymentRow> = {},
): AdminPaymentRow {
  const day = String(10 + index).padStart(2, "0");
  return {
    amount: 1_500_000,
    completedAtUtc: `2026-01-${day}T10:02:00Z`,
    createdAtUtc: `2026-01-${day}T10:01:00Z`,
    currencyCode: "NGN",
    id: `pay-fixture-${index}`,
    intent: "SubscriptionPurchase",
    merchantReference: `FIX-PAY-${String(index).padStart(4, "0")}`,
    ownerDisplayName: `Fixture User ${index}`,
    ownerId: `user-fixture-${index}`,
    paymentStatus: "Succeeded",
    providerName: "Fixture Provider",
    providerReference: `FIXPRV-${index}`,
    ...overrides,
  };
}

export const fixturePaymentRows: readonly AdminPaymentRow[] = [
  fixturePaymentRow(1),
  fixturePaymentRow(2, { amount: 2_000_000, intent: "WalletTopUp" }),
  fixturePaymentRow(3, {
    completedAtUtc: null,
    intent: "WalletTopUp",
    paymentStatus: "Initiated",
  }),
  fixturePaymentRow(4, { paymentStatus: "Failed" }),
  fixturePaymentRow(5, {
    intent: "SubscriptionRenewal",
    ownerDisplayName: null,
  }),
  fixturePaymentRow(6, { paymentStatus: "Underpaid" }),
  fixturePaymentRow(7, { paymentStatus: "ProviderReview" }),
];

export function fixturePaymentList(
  rows: readonly AdminPaymentRow[] = fixturePaymentRows,
): AdminListState<AdminPaymentRow> {
  return {
    page: 1,
    pageSize: 20,
    rows,
    state: "ready",
    totalItems: rows.length,
    totalPages: 1,
  };
}

export function fixturePaymentDetail(
  overrides: Partial<AdminPaymentDetail> = {},
): AdminPaymentDetail {
  return {
    ...fixturePaymentRow(4, { paymentStatus: "Failed" }),
    fulfillment: {
      reason: "FIXTURE: the provider declined the charge.",
      status: "notFulfilled",
    },
    paymentMethodType: "PaymentLink",
    providerEvents: [
      {
        atUtc: "2026-01-14T10:02:12Z",
        event: "fixture.charge.failed",
        id: "evt-1",
        result: "Processed",
        source: "Webhook",
      },
      {
        atUtc: "2026-01-14T10:05:00Z",
        event: "Verify transaction",
        id: "evt-2",
        result: "Confirmed failed",
        source: "Reconciliation",
      },
    ],
    statusHistory: [
      { atUtc: "2026-01-14T10:02:12Z", id: "h-2", label: "Failed" },
      {
        atUtc: "2026-01-14T10:01:00Z",
        id: "h-1",
        label: "Initiated",
        source: "Checkout",
      },
    ],
    tenantName: "Fixture Tenant",
    ...overrides,
  };
}
