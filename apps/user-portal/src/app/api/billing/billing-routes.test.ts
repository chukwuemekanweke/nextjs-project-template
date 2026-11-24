import { ApiError } from "@template/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cancelSubscriptionAtPeriodEnd: vi.fn(),
  getBillingHistory: vi.fn(),
  getCurrentSubscription: vi.fn(),
  getSubscriptionPurchaseStatus: vi.fn(),
  listEligiblePaymentProviders: vi.fn(),
  purchaseSubscription: vi.fn(),
  serverClient: { server: true },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: () => Promise.resolve(mocks.serverClient),
}));
vi.mock("@template/api-client/subscriptions", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@template/api-client/subscriptions")
  >()),
  cancelSubscriptionAtPeriodEnd: mocks.cancelSubscriptionAtPeriodEnd,
  getBillingHistory: mocks.getBillingHistory,
  getCurrentSubscription: mocks.getCurrentSubscription,
  getSubscriptionPurchaseStatus: mocks.getSubscriptionPurchaseStatus,
  listEligiblePaymentProviders: mocks.listEligiblePaymentProviders,
  purchaseSubscription: mocks.purchaseSubscription,
}));

import { GET as listProviders } from "./subscription-plans/[planId]/payment-providers/route";
import { GET as getHistory } from "./subscriptions/billing-history/route";
import { POST as cancelAtPeriodEnd } from "./subscriptions/current/cancellation-at-period-end/route";
import { GET as getCurrent } from "./subscriptions/current/route";
import { GET as getPurchaseStatus } from "./subscriptions/purchases/[purchaseId]/route";
import { POST as purchase } from "./subscriptions/purchases/route";

const KEY = "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10";
const base = "http://portal.test/api/billing";

afterEach(() => vi.clearAllMocks());

function purchaseRequest(
  body: unknown,
  headers: Record<string, string> = { "Idempotency-Key": KEY },
) {
  return new Request(`${base}/subscriptions/purchases`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
  });
}

const validPurchase = {
  autoRenew: true,
  billingAccountOwnerType: "Stakeholder",
  billingInterval: "Yearly",
  paymentProviderId: "provider-1",
  planId: "plan-1",
};

describe("subscription BFF routes", () => {
  it("forwards a purchase with the idempotency key and only documented fields", async () => {
    mocks.purchaseSubscription.mockResolvedValue({ purchaseId: "purchase-1" });

    const response = await purchase(
      purchaseRequest({ ...validPurchase, amount: 1, currencyId: "usd" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      purchaseId: "purchase-1",
    });
    expect(mocks.purchaseSubscription).toHaveBeenCalledWith(
      mocks.serverClient,
      validPurchase,
      KEY,
    );
  });

  it("rejects purchases without a valid idempotency key", async () => {
    const response = await purchase(purchaseRequest(validPurchase, {}));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      errors: { "Idempotency-Key": [expect.any(String)] },
    });
    expect(mocks.purchaseSubscription).not.toHaveBeenCalled();
  });

  it.each([
    ["owner type", { billingAccountOwnerType: "Account" }],
    ["missing interval", { billingInterval: undefined }],
    ["empty interval", { billingInterval: "" }],
  ])("rejects malformed purchase bodies (%s)", async (_label, change) => {
    const response = await purchase(
      purchaseRequest({ ...validPurchase, ...change }),
    );
    expect(response.status).toBe(400);
    expect(mocks.purchaseSubscription).not.toHaveBeenCalled();
  });

  it("preserves backend conflict status without internal detail", async () => {
    mocks.purchaseSubscription.mockRejectedValue(
      new ApiError({
        detail: "internal",
        kind: "conflict",
        safeMessage: "The request conflicts with the current state.",
        status: 409,
      }),
    );

    const response = await purchase(purchaseRequest(validPurchase));

    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).not.toContain("internal");
  });

  it("requires an owner type for owner-scoped reads", async () => {
    const response = await getCurrent(
      new Request(`${base}/subscriptions/current`),
    );
    expect(response.status).toBe(400);
    expect(mocks.getCurrentSubscription).not.toHaveBeenCalled();
  });

  it("passes a missing current subscription through as 404", async () => {
    mocks.getCurrentSubscription.mockRejectedValue(
      new ApiError({
        kind: "not-found",
        safeMessage: "Not found",
        status: 404,
      }),
    );
    const response = await getCurrent(
      new Request(
        `${base}/subscriptions/current?BillingAccountOwnerType=Stakeholder`,
      ),
    );
    expect(response.status).toBe(404);
    expect(mocks.getCurrentSubscription).toHaveBeenCalledWith(
      mocks.serverClient,
      { BillingAccountOwnerType: "Stakeholder" },
    );
  });

  it("forwards provider, purchase status, and history reads with owner scope", async () => {
    mocks.listEligiblePaymentProviders.mockResolvedValue([]);
    mocks.getSubscriptionPurchaseStatus.mockResolvedValue({ status: "x" });
    mocks.getBillingHistory.mockResolvedValue({ items: [] });

    await listProviders(
      new Request(
        `${base}/subscription-plans/plan-1/payment-providers?BillingAccountOwnerType=Tenant`,
      ),
      { params: Promise.resolve({ planId: "plan-1" }) },
    );
    await getPurchaseStatus(
      new Request(
        `${base}/subscriptions/purchases/p-1?BillingAccountOwnerType=Stakeholder`,
      ),
      { params: Promise.resolve({ purchaseId: "p-1" }) },
    );
    await getHistory(
      new Request(
        `${base}/subscriptions/billing-history?BillingAccountOwnerType=Stakeholder&Page=3&PageSize=abc`,
      ),
    );

    expect(mocks.listEligiblePaymentProviders).toHaveBeenCalledWith(
      mocks.serverClient,
      { planId: "plan-1" },
      { BillingAccountOwnerType: "Tenant" },
    );
    expect(mocks.getSubscriptionPurchaseStatus).toHaveBeenCalledWith(
      mocks.serverClient,
      { purchaseId: "p-1" },
      { BillingAccountOwnerType: "Stakeholder" },
    );
    expect(mocks.getBillingHistory).toHaveBeenCalledWith(mocks.serverClient, {
      BillingAccountOwnerType: "Stakeholder",
      Page: 3,
      PageSize: undefined,
    });
  });

  it("schedules cancellation for the validated owner type only", async () => {
    mocks.cancelSubscriptionAtPeriodEnd.mockResolvedValue({
      changed: true,
      entitledUntilUtc: "2026-12-23T12:05:00Z",
      found: true,
    });

    const response = await cancelAtPeriodEnd(
      new Request(`${base}/subscriptions/current/cancellation-at-period-end`, {
        body: JSON.stringify({
          billingAccountId: "someone-else",
          billingAccountOwnerType: "Stakeholder",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith(
      mocks.serverClient,
      { billingAccountOwnerType: "Stakeholder" },
    );
  });
});
