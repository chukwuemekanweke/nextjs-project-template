import { ApiError } from "@template/api-client";
import type { PurchaseSubscriptionMutationResponse } from "@template/api-client/subscriptions";
import { describe, expect, it, vi } from "vitest";
import {
  createCheckoutAttemptStore,
  type CheckoutSelection,
} from "./checkout-attempt";
import {
  checkoutOutcomeFor,
  createCheckoutSubmitter,
  type CheckoutSubmitterOptions,
} from "./checkout-submission";

const selection: CheckoutSelection = {
  autoRenew: true,
  billingAccountOwnerType: "Stakeholder",
  paymentProviderId: "provider-1",
  planId: "plan-1",
};

function response(
  overrides: Partial<PurchaseSubscriptionMutationResponse> = {},
): PurchaseSubscriptionMutationResponse {
  return {
    expiresAtUtc: null,
    instructionFields: {
      paymentLink: "https://provider.example/checkout/abc",
    },
    merchantReference: "pay_1",
    paymentMethodType: "PaymentLink",
    paymentProviderId: "provider-1",
    paymentProviderName: "Bachs",
    paymentStatus: "Initiated",
    purchaseId: "purchase-1",
    subscriptionId: "subscription-1",
    ...overrides,
  };
}

function setup(purchase: CheckoutSubmitterOptions["purchase"]) {
  const values = new Map<string, string>();
  const store = createCheckoutAttemptStore({
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  });
  let keyNumber = 0;
  const createKey = vi.fn(() => `key-${++keyNumber}`);
  const submitter = createCheckoutSubmitter({ createKey, purchase, store });
  return { createKey, store, submitter };
}

const networkError = () =>
  new ApiError({ kind: "network", safeMessage: "Network unavailable" });
const conflict = () =>
  new ApiError({ kind: "conflict", safeMessage: "Conflict", status: 409 });

describe("checkout submission", () => {
  it("submits the selection with a generated idempotency key and remembers the purchase", async () => {
    const purchase = vi.fn().mockResolvedValue(response());
    const { store, submitter } = setup(purchase);

    const outcome = await submitter.submit(selection);

    expect(purchase).toHaveBeenCalledWith({
      idempotencyKey: "key-1",
      request: selection,
    });
    expect(outcome).toMatchObject({
      href: "https://provider.example/checkout/abc",
      type: "redirect",
    });
    expect(store.read()).toMatchObject({
      idempotencyKey: "key-1",
      purchaseId: "purchase-1",
    });
  });

  it("ignores duplicate submissions while one is in flight", async () => {
    let resolve!: (value: PurchaseSubscriptionMutationResponse) => void;
    const purchase = vi.fn(
      () =>
        new Promise<PurchaseSubscriptionMutationResponse>((done) => {
          resolve = done;
        }),
    );
    const { submitter } = setup(purchase);

    const first = submitter.submit(selection);
    expect(submitter.inFlight).toBe(true);
    await expect(submitter.submit(selection)).resolves.toEqual({
      type: "ignored",
    });
    resolve(response());
    await first;

    expect(purchase).toHaveBeenCalledOnce();
    expect(submitter.inFlight).toBe(false);
  });

  it("reuses the same key when retrying after a network failure or timeout", async () => {
    const purchase = vi
      .fn()
      .mockRejectedValueOnce(networkError())
      .mockRejectedValueOnce(
        new ApiError({ kind: "timeout", safeMessage: "Timed out" }),
      )
      .mockResolvedValueOnce(response());
    const { createKey, submitter } = setup(purchase);

    await expect(submitter.submit(selection)).resolves.toMatchObject({
      type: "error",
    });
    await submitter.submit(selection);
    await submitter.submit(selection);

    expect(createKey).toHaveBeenCalledOnce();
    expect(
      purchase.mock.calls.map(
        ([variables]) =>
          (variables as { idempotencyKey: string }).idempotencyKey,
      ),
    ).toEqual(["key-1", "key-1", "key-1"]);
  });

  it("uses a new key when the purchase selection changes", async () => {
    const purchase = vi.fn().mockRejectedValueOnce(networkError());
    purchase.mockResolvedValue(response());
    const { submitter } = setup(purchase);

    await submitter.submit(selection);
    await submitter.submit({ ...selection, autoRenew: false });

    expect(purchase.mock.calls[1]?.[0]).toMatchObject({
      idempotencyKey: "key-2",
      request: { ...selection, autoRenew: false },
    });
  });

  it("reports conflicts and starts a fresh attempt afterwards", async () => {
    const purchase = vi
      .fn()
      .mockRejectedValueOnce(conflict())
      .mockResolvedValueOnce(response());
    const { store, submitter } = setup(purchase);

    const outcome = await submitter.submit(selection);
    expect(outcome).toEqual({
      message: expect.stringContaining(
        "conflicts with an existing subscription",
      ),
      type: "error",
    });
    expect(store.read()).toBeUndefined();

    await submitter.submit(selection);
    expect(purchase.mock.calls[1]?.[0]).toMatchObject({
      idempotencyKey: "key-2",
    });
  });

  it("keeps an unresolved attempt's key even if another tab overwrites the store", async () => {
    const purchase = vi
      .fn()
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce(response());
    const { store, submitter } = setup(purchase);

    await submitter.submit(selection);
    // Another tab starts a different checkout in the shared store.
    store.write({
      ...selection,
      createdAtUtc: new Date().toISOString(),
      idempotencyKey: "other-tab-key",
      planId: "plan-2",
    });
    await submitter.submit(selection);

    expect(purchase.mock.calls[1]?.[0]).toMatchObject({
      idempotencyKey: "key-1",
    });
    expect(store.read()).toMatchObject({
      idempotencyKey: "key-1",
      purchaseId: "purchase-1",
    });
  });

  it("does not discard another tab's attempt after a rejection", async () => {
    const purchase = vi.fn().mockRejectedValueOnce(conflict());
    const { store, submitter } = setup(purchase);
    const otherTab = {
      ...selection,
      createdAtUtc: new Date().toISOString(),
      idempotencyKey: "other-tab-key",
      planId: "plan-2",
    };
    purchase.mockImplementationOnce(async () => {
      store.write(otherTab);
      throw conflict();
    });

    await submitter.submit(selection);
    await submitter.submit({ ...selection, autoRenew: false });

    expect(store.read()).toEqual(otherTab);
  });

  it("continues with the purchase returned for an exact replay", async () => {
    const purchase = vi.fn().mockResolvedValue(response());
    const { store, submitter } = setup(purchase);
    await submitter.submit(selection);
    await submitter.submit(selection);
    expect(purchase.mock.calls.map(([variables]) => variables)).toEqual([
      { idempotencyKey: "key-1", request: selection },
      { idempotencyKey: "key-1", request: selection },
    ]);
    expect(store.read()?.purchaseId).toBe("purchase-1");
  });
});

describe("checkoutOutcomeFor", () => {
  it("navigates only to a backend-returned HTTPS payment link", () => {
    expect(checkoutOutcomeFor(response()).type).toBe("redirect");
    expect(
      checkoutOutcomeFor(
        response({
          instructionFields: { paymentLink: "http://insecure.example" },
        }),
      ).type,
    ).toBe("unsupported");
    expect(
      checkoutOutcomeFor(
        response({ instructionFields: { paymentLink: "javascript:alert(1)" } }),
      ).type,
    ).toBe("unsupported");
    expect(checkoutOutcomeFor(response({ instructionFields: {} })).type).toBe(
      "unsupported",
    );
  });

  it("renders bank transfers and refuses unsupported methods", () => {
    expect(
      checkoutOutcomeFor(
        response({
          instructionFields: { accountNumber: "0123456789" },
          paymentMethodType: "BankTransfer",
        }),
      ).type,
    ).toBe("bank-transfer");
    expect(
      checkoutOutcomeFor(
        response({
          instructionFields: { paymentLink: "https://provider.example/card" },
          paymentMethodType: "Card",
        }),
      ).type,
    ).toBe("unsupported");
  });
});
