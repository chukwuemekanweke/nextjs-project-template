import type { SubscriptionPlanResponse } from "@template/api-client/subscriptions";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  billingCadence,
  offeredBillingIntervals,
  subscriptionCheckoutHref,
  toPricePlan,
  toPricingIntervals,
} from "@/lib/subscription-pricing";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server-api", () => ({
  createPublicServerApiClient: () => {
    throw new Error("tests inject a client");
  },
}));

import type { ApiTransport } from "@template/api-client";
import {
  loadSubscriptionPlans,
  type SubscriptionPlansResult,
} from "@/lib/subscription-plans";
import { SubscriptionPricing } from "./subscription-pricing";

const USER_PORTAL = "https://app.example.com";
const multiInterval: SubscriptionPlanResponse = {
  code: "TEAM",
  currencyCode: "NGN",
  currencyId: "currency-1",
  id: "019a0000-0000-7000-8000-000000000002",
  name: "Team",
  prices: [
    { billingInterval: "Yearly", price: 9000000 },
    { billingInterval: "Monthly", price: 900000 },
  ],
};
const plan: SubscriptionPlanResponse = {
  billingInterval: "Monthly",
  code: "PRO_MONTHLY",
  currencyCode: "NGN",
  currencyId: "currency-1",
  id: "019a0000-0000-7000-8000-000000000001",
  name: "Pro Monthly",
  price: 750000,
};

function render(plans: SubscriptionPlansResult) {
  return renderToStaticMarkup(
    createElement(SubscriptionPricing, {
      heading: "Choose your path",
      plans,
      userPortalUrl: USER_PORTAL,
    }),
  ).replace(/\u00a0/g, " ");
}

describe("subscription pricing helpers", () => {
  it("builds the authenticated checkout destination with the plan id", () => {
    expect(subscriptionCheckoutHref(USER_PORTAL, "plan/../x?y")).toBe(
      "https://app.example.com/billing/checkout?planId=plan%2F..%2Fx%3Fy",
    );
  });

  it("maps backend intervals to display cadence", () => {
    expect(billingCadence("Monthly")).toBe("month");
    expect(billingCadence("Yearly")).toBe("year");
    expect(billingCadence("Weekly")).toBe("weekly");
  });

  it("formats authoritative minor units and keeps marketing copy separate", () => {
    const mapped = toPricePlan(plan, {
      marketing: { PRO_MONTHLY: { description: "For growing teams." } },
      userPortalUrl: USER_PORTAL,
    });
    expect(mapped?.price.replace(/\u00a0/g, " ")).toBe("NGN 7,500.00");
    expect(mapped?.description).toBe("For growing teams.");
    expect(mapped?.features).toBeUndefined();
    expect(mapped?.action.href).toBe(
      `${USER_PORTAL}/billing/checkout?planId=${plan.id}&billingInterval=Monthly`,
    );
  });

  it("prices multi-interval plans at monthly and prefers API copy", () => {
    const mapped = toPricePlan(
      {
        code: "PRO",
        currencyCode: "NGN",
        currencyId: "currency-1",
        description: "From the API.",
        features: ["API feature"],
        id: plan.id,
        name: "Pro",
        prices: [
          { billingInterval: "Yearly", price: 7500000 },
          { billingInterval: "Monthly", price: 750000 },
        ],
      },
      {
        marketing: { PRO: { description: "Local", highlights: ["Local"] } },
        userPortalUrl: USER_PORTAL,
      },
    );
    expect(mapped?.price.replace(/\u00a0/g, " ")).toBe("NGN 7,500.00");
    expect(mapped?.cadence).toBe("month");
    expect(mapped?.description).toBe("From the API.");
    expect(mapped?.features).toEqual(["API feature"]);
    expect(mapped?.action.href).toContain("billingInterval=Monthly");
  });

  it("prices a plan at a requested interval and skips plans without it", () => {
    const yearly = toPricePlan(multiInterval, {
      billingInterval: "Yearly",
      userPortalUrl: USER_PORTAL,
    });
    expect(yearly?.price.replace(/ /g, " ")).toBe("NGN 90,000.00");
    expect(yearly?.cadence).toBe("year");
    expect(yearly?.action.href).toContain("billingInterval=Yearly");
    expect(
      toPricePlan(plan, {
        billingInterval: "Yearly",
        userPortalUrl: USER_PORTAL,
      }),
    ).toBeUndefined();
  });

  it("orders offered intervals Monthly, Yearly, then backend order", () => {
    expect(
      offeredBillingIntervals([
        { ...plan, billingInterval: "Weekly" },
        multiInterval,
      ]),
    ).toEqual(["Monthly", "Yearly", "Weekly"]);
  });

  it("groups plan cards by interval with only the plans that offer it", () => {
    const intervals = toPricingIntervals([plan, multiInterval], {
      userPortalUrl: USER_PORTAL,
    });
    expect(intervals.map((interval) => interval.value)).toEqual([
      "Monthly",
      "Yearly",
    ]);
    expect(intervals[0]?.plans.map((card) => card.name)).toEqual([
      "Pro Monthly",
      "Team",
    ]);
    expect(intervals[1]?.plans.map((card) => card.name)).toEqual(["Team"]);
  });

  it("skips plans that offer no price", () => {
    expect(
      toPricePlan(
        { ...plan, billingInterval: undefined, price: undefined, prices: [] },
        { userPortalUrl: USER_PORTAL },
      ),
    ).toBeUndefined();
  });
});

describe("loadSubscriptionPlans", () => {
  it("loads plans on the server with a cached, tagged request", async () => {
    const request = vi.fn().mockResolvedValue([plan]);
    const client = { request } as unknown as ApiTransport;

    await expect(loadSubscriptionPlans(client)).resolves.toEqual({
      plans: [plan],
      status: "loaded",
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        next: { revalidate: 60, tags: ["subscription-plans"] },
        path: "/api/v1/subscription-plans",
      }),
    );
  });

  it("reports an unavailable state instead of failing the page", async () => {
    const client = {
      request: vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
    } as unknown as ApiTransport;
    await expect(loadSubscriptionPlans(client)).resolves.toEqual({
      status: "unavailable",
    });
  });
});

describe("SubscriptionPricing", () => {
  it("renders backend plans with formatted prices and a checkout CTA", () => {
    const markup = render({ plans: [plan], status: "loaded" });

    expect(markup).toContain("Pro Monthly");
    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toContain("/ month");
    expect(markup).toContain("Billed monthly in NGN.");
    expect(markup).toContain(
      `href="${USER_PORTAL}/billing/checkout?planId=${plan.id}&amp;billingInterval=Monthly"`,
    );
    expect(markup).toContain('aria-label="Subscribe: Pro Monthly"');
  });

  it("hides the interval switch when only one interval is offered", () => {
    expect(render({ plans: [plan], status: "loaded" })).not.toContain(
      'aria-label="Billing interval"',
    );
  });

  it("offers an interval switch showing monthly prices first", () => {
    const markup = render({ plans: [plan, multiInterval], status: "loaded" });

    expect(markup).toContain('aria-label="Billing interval"');
    expect(markup).toContain("NGN 9,000.00");
    expect(markup).not.toContain("NGN 90,000.00");
    expect(markup).toContain(
      `href="${USER_PORTAL}/billing/checkout?planId=${multiInterval.id}&amp;billingInterval=Monthly"`,
    );
  });

  it("shows an empty state when no plans are active", () => {
    expect(render({ plans: [], status: "loaded" })).toContain(
      "No subscription plans are available",
    );
  });

  it("shows an empty state when no plan offers a price", () => {
    const markup = render({
      plans: [{ ...plan, billingInterval: undefined, price: undefined }],
      status: "loaded",
    });
    expect(markup).toContain("No subscription plans are available");
    expect(markup).toContain('role="status"');
  });

  it("shows a safe error state when plans cannot be loaded", () => {
    const markup = render({ status: "unavailable" });
    expect(markup).toContain("Plans could not be loaded right now.");
    expect(markup).not.toContain("ECONNREFUSED");
    expect(markup).toContain('role="alert"');
  });
});
