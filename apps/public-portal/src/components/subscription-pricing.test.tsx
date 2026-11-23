import type { SubscriptionPlanResponse } from "@template/api-client/subscriptions";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  billingCadence,
  subscriptionCheckoutHref,
  toPricePlan,
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
    expect(mapped.price.replace(/\u00a0/g, " ")).toBe("NGN 7,500.00");
    expect(mapped.description).toBe("For growing teams.");
    expect(mapped.features).toBeUndefined();
    expect(mapped.action.href).toBe(
      `${USER_PORTAL}/billing/checkout?planId=${plan.id}`,
    );
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
    expect(markup).toContain("/month");
    expect(markup).toContain("Billed monthly in NGN.");
    expect(markup).toContain(
      `href="${USER_PORTAL}/billing/checkout?planId=${plan.id}"`,
    );
    expect(markup).toContain('aria-label="Subscribe: Pro Monthly"');
  });

  it("shows an empty state when no plans are active", () => {
    expect(render({ plans: [], status: "loaded" })).toContain(
      "No subscription plans are available",
    );
  });

  it("shows a safe error state when plans cannot be loaded", () => {
    const markup = render({ status: "unavailable" });
    expect(markup).toContain("Plans could not be loaded right now.");
    expect(markup).not.toContain("ECONNREFUSED");
    expect(markup).toContain('role="alert"');
  });
});
