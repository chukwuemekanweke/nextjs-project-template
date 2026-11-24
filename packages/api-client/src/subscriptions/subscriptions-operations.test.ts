import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "../api-client";
import { ApiError } from "../client";
import {
  cancelSubscriptionAtPeriodEnd,
  getBillingHistory,
  getCurrentSubscription,
  getSubscriptionPurchaseStatus,
  isIdempotencyKey,
  listEligiblePaymentProviders,
  listSubscriptionPlans,
  purchaseSubscription,
} from "./operations";

const base = "http://api.test/api/v1";
const TENANT_ID = "1203d9d1-2a6b-48ef-9cc1-e561a23aff72";
const KEY = "4d3c3a2e-6f9b-4f43-9a55-0c5b3f6f1a10";
const PLAN_ID = "019a0000-0000-7000-8000-000000000001";
const PURCHASE_ID = "019a0000-0000-7000-8000-000000000002";

const server = setupServer();
const client = () =>
  createApiClient({
    baseUrl: "http://api.test",
    defaultHeaders: { "X-Tenant-Id": TENANT_ID },
  });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const purchaseResponse = {
  expiresAtUtc: "2026-11-23T13:00:00Z",
  instructionFields: {
    merchantReference: "pay_1",
    paymentLink: "https://provider.example/checkout/1",
    providerReference: "checkout_1",
  },
  merchantReference: "pay_1",
  paymentMethodType: "PaymentLink",
  paymentProviderId: "provider-1",
  paymentProviderName: "Bachs",
  paymentStatus: "Initiated",
  purchaseId: PURCHASE_ID,
  subscriptionId: "subscription-1",
};

describe("subscription operations", () => {
  it("lists public plans without converting minor-unit prices", async () => {
    const plans = [
      {
        code: "PRO",
        currencyCode: "NGN",
        currencyId: "currency-1",
        id: PLAN_ID,
        name: "Pro",
        prices: [
          { billingInterval: "Monthly", price: 750000 },
          { billingInterval: "Yearly", price: 7500000 },
        ],
      },
    ];
    server.use(
      http.get(`${base}/subscription-plans`, ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);
        expect(request.headers.get("Authorization")).toBeNull();
        return HttpResponse.json(plans);
      }),
    );

    await expect(listSubscriptionPlans(client())).resolves.toEqual(plans);
  });

  it("lists eligible providers for an encoded plan id and owner type", async () => {
    server.use(
      http.get(
        `${base}/subscription-plans/:planId/payment-providers`,
        ({ params, request }) => {
          expect(params.planId).toBe(PLAN_ID);
          expect(new URL(request.url).searchParams.toString()).toBe(
            "BillingAccountOwnerType=Tenant",
          );
          return HttpResponse.json([
            {
              id: "provider-1",
              name: "Bachs",
              paymentMethodType: "PaymentLink",
              supportsRecurringPayments: true,
            },
          ]);
        },
      ),
    );

    await expect(
      listEligiblePaymentProviders(
        client(),
        { planId: PLAN_ID },
        { BillingAccountOwnerType: "Tenant" },
      ),
    ).resolves.toHaveLength(1);
  });

  it("posts a purchase with the Idempotency-Key header and exact body", async () => {
    const request = {
      autoRenew: false,
      billingAccountOwnerType: "Stakeholder" as const,
      billingInterval: "Yearly",
      paymentProviderId: "provider-1",
      planId: PLAN_ID,
    };
    server.use(
      http.post(`${base}/subscriptions/purchases`, async ({ request: r }) => {
        expect(r.headers.get("Idempotency-Key")).toBe(KEY);
        expect(r.headers.get("X-Tenant-Id")).toBe(TENANT_ID);
        expect(r.headers.get("Content-Type")).toBe("application/json");
        expect(await r.json()).toEqual(request);
        return HttpResponse.json(purchaseResponse);
      }),
    );

    await expect(
      purchaseSubscription(client(), request, KEY, {
        headers: { "Idempotency-Key": "ignored-override" },
      }),
    ).resolves.toEqual(purchaseResponse);
  });

  it("rejects missing or empty idempotency keys before sending", () => {
    const request = {
      autoRenew: true,
      billingAccountOwnerType: "Stakeholder" as const,
      billingInterval: "Yearly",
      paymentProviderId: "provider-1",
      planId: PLAN_ID,
    };
    expect(() => purchaseSubscription(client(), request, "")).toThrow(
      TypeError,
    );
    expect(() =>
      purchaseSubscription(
        client(),
        request,
        "00000000-0000-0000-0000-000000000000",
      ),
    ).toThrow(TypeError);
    expect(isIdempotencyKey(KEY)).toBe(true);
    expect(isIdempotencyKey("not-a-uuid")).toBe(false);
  });

  it("normalizes purchase conflicts", async () => {
    server.use(
      http.post(`${base}/subscriptions/purchases`, () =>
        HttpResponse.json(
          {
            detail: "Idempotency key was reused with a different request.",
            status: 409,
            title: "Conflict",
          },
          { status: 409 },
        ),
      ),
    );

    const error = await purchaseSubscription(
      client(),
      {
        autoRenew: true,
        billingAccountOwnerType: "Stakeholder",
        billingInterval: "Monthly",
        paymentProviderId: "provider-1",
        planId: PLAN_ID,
      },
      KEY,
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).kind).toBe("conflict");
  });

  it("reads purchase status scoped to the owner type", async () => {
    const status = {
      amount: 750000,
      currencyCode: "NGN",
      currentPeriodEndUtc: null,
      fulfilledAtUtc: null,
      fulfillmentBlockedAtUtc: null,
      fulfillmentBlockedReason: null,
      fulfillmentStatus: "Pending",
      isTerminal: false,
      merchantReference: "pay_1",
      paymentCompletedAtUtc: "2026-11-23T12:05:00Z",
      paymentExpiresAtUtc: null,
      paymentMethodType: "PaymentLink",
      paymentProviderName: "Bachs",
      paymentStatus: "Succeeded",
      purchaseId: PURCHASE_ID,
      shouldContinuePolling: true,
      status: "PaymentSucceededFulfillmentPending",
      subscriptionId: "subscription-1",
      subscriptionStatus: "Pending",
    };
    server.use(
      http.get(
        `${base}/subscriptions/purchases/:purchaseId`,
        ({ params, request }) => {
          expect(params.purchaseId).toBe(PURCHASE_ID);
          expect(
            new URL(request.url).searchParams.get("BillingAccountOwnerType"),
          ).toBe("Stakeholder");
          return HttpResponse.json(status);
        },
      ),
    );

    await expect(
      getSubscriptionPurchaseStatus(
        client(),
        { purchaseId: PURCHASE_ID },
        { BillingAccountOwnerType: "Stakeholder" },
      ),
    ).resolves.toEqual(status);
  });

  it("surfaces a missing current subscription as a not-found ApiError", async () => {
    server.use(
      http.get(`${base}/subscriptions/current`, ({ request }) => {
        expect(
          new URL(request.url).searchParams.get("BillingAccountOwnerType"),
        ).toBe("Stakeholder");
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const error = await getCurrentSubscription(client(), {
      BillingAccountOwnerType: "Stakeholder",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe("not-found");
  });

  it("requests billing history with owner and pagination parameters", async () => {
    const page = { items: [], page: 2, pageSize: 10, totalCount: 11 };
    server.use(
      http.get(`${base}/subscriptions/billing-history`, ({ request }) => {
        const parameters = new URL(request.url).searchParams;
        expect(parameters.get("BillingAccountOwnerType")).toBe("Stakeholder");
        expect(parameters.get("Page")).toBe("2");
        expect(parameters.get("PageSize")).toBe("10");
        return HttpResponse.json(page);
      }),
    );

    await expect(
      getBillingHistory(client(), {
        BillingAccountOwnerType: "Stakeholder",
        Page: 2,
        PageSize: 10,
      }),
    ).resolves.toEqual(page);
  });

  it("normalizes billing-history validation errors", async () => {
    server.use(
      http.get(`${base}/subscriptions/billing-history`, () =>
        HttpResponse.json(
          {
            errors: { PageSize: ["Must be between 1 and 100."] },
            status: 400,
            title: "Validation failed",
          },
          { status: 400 },
        ),
      ),
    );

    const error = await getBillingHistory(client(), {
      BillingAccountOwnerType: "Stakeholder",
      PageSize: 500,
    }).catch((caught: unknown) => caught);

    expect((error as ApiError).kind).toBe("validation");
    expect((error as ApiError).validationErrors).toEqual({
      PageSize: ["Must be between 1 and 100."],
    });
  });

  it("schedules cancellation at period end with the owner body", async () => {
    server.use(
      http.post(
        `${base}/subscriptions/current/cancellation-at-period-end`,
        async ({ request }) => {
          expect(await request.json()).toEqual({
            billingAccountOwnerType: "Stakeholder",
          });
          return HttpResponse.json({
            changed: true,
            entitledUntilUtc: "2026-12-23T12:05:00Z",
            found: true,
          });
        },
      ),
    );

    await expect(
      cancelSubscriptionAtPeriodEnd(client(), {
        billingAccountOwnerType: "Stakeholder",
      }),
    ).resolves.toEqual({
      changed: true,
      entitledUntilUtc: "2026-12-23T12:05:00Z",
      found: true,
    });
  });

  it("exposes the domain through the composed API client", async () => {
    server.use(
      http.get(`${base}/subscription-plans`, () => HttpResponse.json([])),
    );
    await expect(
      client().subscriptions.listSubscriptionPlans(),
    ).resolves.toEqual([]);
  });
});
