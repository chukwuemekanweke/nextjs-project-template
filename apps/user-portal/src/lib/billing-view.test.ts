import { ApiError } from "@template/api-client";
import type { GetCurrentSubscriptionQueryResponse } from "@template/api-client/subscriptions";
import { describe, expect, it } from "vitest";
import {
  abbreviateReference,
  offeredBillingIntervals,
  resolveBillingHistoryPlacement,
  resolveBillingView,
  resolvePlanLayout,
  resolvePlanPresentation,
} from "./billing-view";

function subscription(
  overrides: Partial<GetCurrentSubscriptionQueryResponse> = {},
): GetCurrentSubscriptionQueryResponse {
  return {
    autoRenew: true,
    billingAccountId: "account-1",
    billingInterval: "Monthly",
    cancelAtPeriodEnd: false,
    cancellationEffectiveAtUtc: null,
    cancellationRequestedAtUtc: null,
    currencyCode: "NGN",
    currencyId: "currency-1",
    currentPeriodEndUtc: "2026-12-23T12:05:00Z",
    currentPeriodStartUtc: "2026-11-23T12:05:00Z",
    id: "subscription-1",
    lifecycleStatus: "Active",
    nextBillingAtUtc: "2026-12-22T12:05:00Z",
    planCode: "PRO_MONTHLY",
    planId: "plan-1",
    planName: "Pro Monthly",
    planPrice: 750000,
    status: "Active",
    ...overrides,
  };
}

describe("resolveBillingView", () => {
  it("never treats a loading query as no subscription", () => {
    expect(resolveBillingView({ isPending: true })).toEqual({
      kind: "loading",
    });
  });

  it.each([401, 403, 500])(
    "keeps a %s failure as an error instead of plan discovery",
    (status) => {
      const error = new ApiError({ kind: "server", safeMessage: "x", status });
      expect(
        resolveBillingView({ error, isError: true, isPending: false }),
      ).toEqual({ error, kind: "error" });
    },
  );

  it("treats only the mapped 404 (null) as no subscription", () => {
    expect(resolveBillingView({ data: null, isPending: false })).toEqual({
      kind: "discovery",
    });
  });

  it.each([
    ["Active", {}],
    ["PastDue", { lifecycleStatus: "PastDue" }],
    ["cancellation scheduled", { autoRenew: false, cancelAtPeriodEnd: true }],
    ["Scheduled", { lifecycleStatus: "Scheduled", status: "Scheduled" }],
    ["an unknown status", { lifecycleStatus: "Paused", status: "Paused" }],
  ])("shows the current subscription for %s", (_label, overrides) => {
    const data = subscription(overrides);
    expect(resolveBillingView({ data, isPending: false })).toEqual({
      kind: "subscription",
      subscription: data,
    });
  });

  it("shows a pending purchase without plan discovery", () => {
    const data = subscription({
      lifecycleStatus: "Pending",
      status: "Pending",
    });
    expect(resolveBillingView({ data, isPending: false }).kind).toBe("pending");
  });

  it.each(["Cancelled", "Expired"])(
    "offers plans for an ended %s subscription",
    (status) => {
      const data = subscription({ lifecycleStatus: status, status });
      expect(resolveBillingView({ data, isPending: false }).kind).toBe(
        "discovery",
      );
    },
  );
});

describe("resolvePlanLayout", () => {
  it.each([
    [0, "empty"],
    [1, "single"],
    [2, "pair"],
    [3, "grid"],
    [4, "grid"],
    [7, "grid"],
  ] as const)("uses %s plans → %s", (count, layout) => {
    expect(resolvePlanLayout(count)).toBe(layout);
  });
});

describe("resolveBillingHistoryPlacement", () => {
  it.each([
    // view, history, planCount, expected
    ["discovery", 0, 2, "hidden"],
    ["discovery", 0, 3, "hidden"],
    ["discovery", "loading", 2, "hidden"],
    ["discovery", 5, undefined, "hidden"],
    ["discovery", 5, 0, "inline"],
    ["discovery", 5, 1, "inline"],
    ["discovery", 5, 2, "inline"],
    ["discovery", 5, 3, "link"],
    ["discovery", 5, 4, "link"],
    ["discovery", "error", 2, "inline"],
    ["discovery", "error", 3, "link"],
    ["subscription", 0, 5, "inline"],
    ["subscription", "loading", 5, "inline"],
    ["subscription", 10, 3, "inline"],
    ["pending", 1, undefined, "inline"],
    ["pending", 0, undefined, "hidden"],
    ["loading", 5, 2, "hidden"],
    ["error", 5, 2, "hidden"],
  ] as const)(
    "%s with history %s and %s plans → %s",
    (view, history, planCount, expected) => {
      expect(resolveBillingHistoryPlacement({ history, planCount, view })).toBe(
        expected,
      );
    },
  );
});

describe("abbreviateReference", () => {
  it("keeps short references and shortens long ones around an ellipsis", () => {
    expect(abbreviateReference("pay_1")).toBe("pay_1");
    const long = "pay_019a2b3c4d5e6f708f3d";
    const short = abbreviateReference(long);
    expect(short).toHaveLength(14);
    expect(short.startsWith("pay_019")).toBe(true);
    expect(short.endsWith("708f3d")).toBe(true);
    expect(short).toContain("…");
  });
});

describe("resolvePlanPresentation", () => {
  const basePlan = {
    billingInterval: "Monthly",
    code: "STARTER_MONTHLY",
    currencyCode: "NGN",
    currencyId: "currency-1",
    id: "plan-1",
    name: "Starter Monthly",
    price: 500000,
  };

  it("uses API fields, then configuration, then the placeholder", () => {
    const placeholder = { description: "Placeholder", features: ["P"] };
    expect(
      resolvePlanPresentation(
        { ...basePlan, description: " ", features: [], recommended: null },
        { description: "Config" },
        placeholder,
      ),
    ).toEqual({
      badge: undefined,
      description: "Config",
      features: ["P"],
      recommended: false,
    });
    expect(
      resolvePlanPresentation(
        {
          ...basePlan,
          badge: "Starter",
          description: "API",
          features: ["A"],
          recommended: true,
        },
        { badge: "Config", description: "Config", features: ["C"] },
        placeholder,
      ),
    ).toEqual({
      badge: "Starter",
      description: "API",
      features: ["A"],
      recommended: true,
    });
  });

  it("works without any presentation source", () => {
    expect(resolvePlanPresentation(basePlan, undefined, undefined)).toEqual({
      badge: undefined,
      description: undefined,
      features: [],
      recommended: false,
    });
  });
});

describe("offeredBillingIntervals", () => {
  it("collects each offered interval once, in first-seen order", () => {
    const base = {
      code: "A",
      currencyCode: "NGN",
      currencyId: "c",
      name: "A",
    };
    expect(
      offeredBillingIntervals([
        { ...base, id: "1", prices: [{ billingInterval: "Yearly", price: 1 }] },
        {
          ...base,
          id: "2",
          prices: [
            { billingInterval: "Monthly", price: 1 },
            { billingInterval: "Yearly", price: 2 },
          ],
        },
        { ...base, billingInterval: "Monthly", id: "3", price: 1 },
      ]),
    ).toEqual(["Yearly", "Monthly"]);
  });
});
