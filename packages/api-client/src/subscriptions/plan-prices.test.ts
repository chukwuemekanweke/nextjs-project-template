import { describe, expect, it } from "vitest";
import {
  defaultSubscriptionPlanPrice,
  findSubscriptionPlanPrice,
  subscriptionPlanPrices,
} from "./plan-prices";

const monthly = { billingInterval: "Monthly", price: 500000 };
const yearly = { billingInterval: "Yearly", price: 5000000 };

describe("subscription plan prices", () => {
  it("returns backend prices unchanged and in order", () => {
    expect(subscriptionPlanPrices({ prices: [yearly, monthly] })).toEqual([
      yearly,
      monthly,
    ]);
  });

  it("falls back to the legacy single-interval fields", () => {
    expect(
      subscriptionPlanPrices({ billingInterval: "Yearly", price: 5000000 }),
    ).toEqual([yearly]);
    expect(subscriptionPlanPrices({ prices: [] })).toEqual([]);
    expect(subscriptionPlanPrices({})).toEqual([]);
  });

  it("finds an offered interval and never invents one", () => {
    const plan = { prices: [monthly] };
    expect(findSubscriptionPlanPrice(plan, "Monthly")).toBe(monthly);
    expect(findSubscriptionPlanPrice(plan, "Yearly")).toBeUndefined();
    expect(findSubscriptionPlanPrice(plan, undefined)).toBeUndefined();
  });

  it("defaults to the preferred, then Monthly, then the first interval", () => {
    const plan = { prices: [yearly, monthly] };
    expect(defaultSubscriptionPlanPrice(plan, "Yearly")).toBe(yearly);
    expect(defaultSubscriptionPlanPrice(plan, "Weekly")).toBe(monthly);
    expect(defaultSubscriptionPlanPrice(plan)).toBe(monthly);
    expect(defaultSubscriptionPlanPrice({ prices: [yearly] })).toBe(yearly);
    expect(defaultSubscriptionPlanPrice({ prices: [] })).toBeUndefined();
  });
});
