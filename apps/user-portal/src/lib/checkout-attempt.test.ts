import { describe, expect, it, vi } from "vitest";
import {
  CHECKOUT_ATTEMPT_STORAGE_KEY,
  createCheckoutAttemptStore,
  parseCheckoutAttempt,
  resolveCheckoutAttempt,
  type CheckoutAttempt,
  type CheckoutSelection,
} from "./checkout-attempt";

const selection: CheckoutSelection = {
  autoRenew: true,
  billingAccountOwnerType: "Stakeholder",
  paymentProviderId: "provider-1",
  planId: "plan-1",
};
const NOW = new Date("2026-11-23T12:00:00Z");

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => void values.delete(key)),
    setItem: vi.fn((key: string, value: string) => void values.set(key, value)),
    values,
  };
}

describe("resolveCheckoutAttempt", () => {
  it("creates one key for a new logical checkout attempt", () => {
    const createKey = vi.fn(() => "key-1");
    expect(
      resolveCheckoutAttempt(undefined, selection, createKey, NOW),
    ).toEqual({
      ...selection,
      createdAtUtc: NOW.toISOString(),
      idempotencyKey: "key-1",
    });
    expect(createKey).toHaveBeenCalledOnce();
  });

  it("reuses the key for an identical retry", () => {
    const existing = resolveCheckoutAttempt(
      undefined,
      selection,
      () => "key-1",
    );
    const createKey = vi.fn(() => "key-2");
    expect(
      resolveCheckoutAttempt(existing, { ...selection }, createKey)
        .idempotencyKey,
    ).toBe("key-1");
    expect(createKey).not.toHaveBeenCalled();
  });

  it.each([
    ["plan", { planId: "plan-2" }],
    ["provider", { paymentProviderId: "provider-2" }],
    ["owner type", { billingAccountOwnerType: "Tenant" as const }],
    ["auto-renew", { autoRenew: false }],
  ])("creates a new key when the %s changes", (_field, change) => {
    const existing = resolveCheckoutAttempt(
      undefined,
      selection,
      () => "key-1",
    );
    expect(
      resolveCheckoutAttempt(
        existing,
        { ...selection, ...change },
        () => "key-2",
      ).idempotencyKey,
    ).toBe("key-2");
  });

  it("never reuses the key of a settled attempt", () => {
    const settled: CheckoutAttempt = {
      ...selection,
      createdAtUtc: NOW.toISOString(),
      idempotencyKey: "key-1",
      purchaseId: "purchase-1",
      settledAtUtc: NOW.toISOString(),
    };
    expect(
      resolveCheckoutAttempt(settled, selection, () => "key-2").idempotencyKey,
    ).toBe("key-2");
  });
});

describe("checkout attempt store", () => {
  const attempt: CheckoutAttempt = {
    ...selection,
    createdAtUtc: NOW.toISOString(),
    idempotencyKey: "key-1",
    purchaseId: "purchase-1",
  };

  it("round-trips the attempt in session storage", () => {
    const storage = memoryStorage();
    const store = createCheckoutAttemptStore(storage, () => NOW);
    store.write(attempt);
    expect(store.read()).toEqual(attempt);
    store.clear();
    expect(store.read()).toBeUndefined();
  });

  it("discards expired and malformed attempts", () => {
    const later = new Date(NOW.getTime() + 25 * 60 * 60 * 1000);
    const storage = memoryStorage({
      [CHECKOUT_ATTEMPT_STORAGE_KEY]: JSON.stringify(attempt),
    });
    expect(
      createCheckoutAttemptStore(storage, () => later).read(),
    ).toBeUndefined();
    expect(storage.values.has(CHECKOUT_ATTEMPT_STORAGE_KEY)).toBe(false);

    expect(parseCheckoutAttempt("{not json", NOW)).toBeUndefined();
    expect(
      parseCheckoutAttempt(
        JSON.stringify({ ...attempt, autoRenew: "yes" }),
        NOW,
      ),
    ).toBeUndefined();
  });

  it("marks only the matching purchase as settled", () => {
    const storage = memoryStorage();
    const store = createCheckoutAttemptStore(storage, () => NOW);
    store.write(attempt);
    store.markSettled("another-purchase");
    expect(store.read()?.settledAtUtc).toBeUndefined();
    store.markSettled("purchase-1");
    expect(store.read()).toEqual({
      ...attempt,
      settledAtUtc: NOW.toISOString(),
    });
  });

  it("discards only the attempt that still uses the given key", () => {
    const storage = memoryStorage();
    const store = createCheckoutAttemptStore(storage, () => NOW);
    store.write(attempt);
    store.discard("key-from-another-tab");
    expect(store.read()).toEqual(attempt);
    store.discard("key-1");
    expect(store.read()).toBeUndefined();
  });

  it("degrades safely when storage is unavailable", () => {
    const failing = {
      getItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const store = createCheckoutAttemptStore(failing, () => NOW);
    expect(() => store.write(attempt)).not.toThrow();
    expect(store.read()).toBeUndefined();
    expect(() => store.clear()).not.toThrow();
    expect(createCheckoutAttemptStore(undefined).read()).toBeUndefined();
  });

  it("stores identifiers and selection only", () => {
    const storage = memoryStorage();
    createCheckoutAttemptStore(storage, () => NOW).write(attempt);
    expect(
      Object.keys(
        JSON.parse(storage.values.get(CHECKOUT_ATTEMPT_STORAGE_KEY)!) as object,
      ).sort(),
    ).toEqual([
      "autoRenew",
      "billingAccountOwnerType",
      "createdAtUtc",
      "idempotencyKey",
      "paymentProviderId",
      "planId",
      "purchaseId",
    ]);
  });
});
