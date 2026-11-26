import type { AdminListState } from "../admin-billing-shared/billing-model";
import type { AdminPlan } from "./plans-model";

/*
 * PREVIEW ONLY. Deterministic plan fixtures for the plans table and editor,
 * used by tests (there is no route). Production modules must never import
 * this file or fall back to it; `plans-screen.test.tsx` enforces it.
 */

export function fixturePlan(
  index: number,
  overrides: Partial<AdminPlan> = {},
): AdminPlan {
  const monthly = 500_000 * index;
  return {
    code: `FIXTURE_${index}`,
    currencyCode: "NGN",
    description: `FIXTURE plan ${index} description.`,
    features: [`Fixture feature ${index}A`, `Fixture feature ${index}B`],
    id: `plan-fixture-${index}`,
    isActive: true,
    name: `Fixture Plan ${index}`,
    prices: [
      { billingInterval: "Monthly", price: monthly },
      { billingInterval: "Yearly", price: monthly * 10 },
    ],
    subscriberCount: 10 * index,
    ...overrides,
  };
}

export const fixturePlans: readonly AdminPlan[] = [
  fixturePlan(1),
  fixturePlan(2),
  fixturePlan(3, { subscriberCount: null }),
  fixturePlan(4, {
    isActive: false,
    name: "Fixture Legacy",
    subscriberCount: 0,
  }),
];

export function fixturePlanList(
  rows: readonly AdminPlan[] = fixturePlans,
): AdminListState<AdminPlan> {
  return {
    page: 1,
    pageSize: rows.length || 1,
    rows,
    state: "ready",
    totalItems: rows.length,
    totalPages: 1,
  };
}
