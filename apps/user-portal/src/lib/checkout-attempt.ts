import type { BillingAccountOwnerType } from "@template/api-client/subscriptions";

/**
 * Navigation/retry state for one logical checkout attempt. It is never a
 * source of truth for payment or subscription state and holds no credentials:
 * only identifiers, the user's selection, and the idempotency key.
 */
export type CheckoutSelection = Readonly<{
  autoRenew: boolean;
  billingAccountOwnerType: BillingAccountOwnerType;
  /** The plan's offered interval being purchased. */
  billingInterval: string;
  paymentProviderId: string;
  planId: string;
}>;

export type CheckoutAttempt = CheckoutSelection &
  Readonly<{
    createdAtUtc: string;
    idempotencyKey: string;
    /** Set once the backend accepted the purchase for this key. */
    purchaseId?: string;
    /**
     * Set once the purchase reached a final outcome. A settled attempt is
     * kept only for navigation (for example "start a new checkout") and its
     * key is never reused.
     */
    settledAtUtc?: string;
  }>;

export const CHECKOUT_ATTEMPT_STORAGE_KEY = "user-portal.subscription-checkout";
/** Attempts older than this are discarded rather than replayed. */
export const CHECKOUT_ATTEMPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type CheckoutAttemptStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

export function isSameSelection(
  attempt: CheckoutSelection,
  selection: CheckoutSelection,
): boolean {
  return (
    attempt.planId === selection.planId &&
    attempt.paymentProviderId === selection.paymentProviderId &&
    attempt.billingAccountOwnerType === selection.billingAccountOwnerType &&
    attempt.billingInterval === selection.billingInterval &&
    attempt.autoRenew === selection.autoRenew
  );
}

/**
 * Reuses the stored attempt (and its idempotency key) for an identical,
 * unsettled selection, so retries after timeouts, network failures, or
 * interruptions replay the same purchase. A changed field or a settled
 * attempt starts a new attempt and key.
 */
export function resolveCheckoutAttempt(
  existing: CheckoutAttempt | undefined,
  selection: CheckoutSelection,
  createKey: () => string,
  now: Date = new Date(),
): CheckoutAttempt {
  if (
    existing &&
    !existing.settledAtUtc &&
    isSameSelection(existing, selection)
  ) {
    return existing;
  }
  return {
    ...selection,
    createdAtUtc: now.toISOString(),
    idempotencyKey: createKey(),
  };
}

function isAttempt(value: unknown): value is CheckoutAttempt {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.planId === "string" &&
    typeof candidate.paymentProviderId === "string" &&
    (candidate.billingAccountOwnerType === "Stakeholder" ||
      candidate.billingAccountOwnerType === "Tenant") &&
    typeof candidate.billingInterval === "string" &&
    typeof candidate.autoRenew === "boolean" &&
    typeof candidate.idempotencyKey === "string" &&
    typeof candidate.createdAtUtc === "string" &&
    (candidate.purchaseId === undefined ||
      typeof candidate.purchaseId === "string") &&
    (candidate.settledAtUtc === undefined ||
      typeof candidate.settledAtUtc === "string")
  );
}

/** Parses a stored attempt, rejecting malformed or expired values. */
export function parseCheckoutAttempt(
  raw: string | null | undefined,
  now: Date = new Date(),
): CheckoutAttempt | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAttempt(parsed)) return undefined;
    const age = now.getTime() - Date.parse(parsed.createdAtUtc);
    return Number.isFinite(age) && age <= CHECKOUT_ATTEMPT_MAX_AGE_MS
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

export interface CheckoutAttemptStore {
  clear(): void;
  /**
   * Removes the stored attempt only if it still uses `idempotencyKey`, so one
   * tab never discards an attempt another tab has since started.
   */
  discard(idempotencyKey: string): void;
  /** Marks the attempt for `purchaseId` as settled, if it is the stored one. */
  markSettled(purchaseId: string): void;
  read(): CheckoutAttempt | undefined;
  write(attempt: CheckoutAttempt): void;
}

/** Storage failures (private mode, quotas) degrade to "no remembered attempt". */
export function createCheckoutAttemptStore(
  storage: CheckoutAttemptStorage | undefined,
  now: () => Date = () => new Date(),
): CheckoutAttemptStore {
  function clear() {
    try {
      storage?.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }
  function read() {
    let raw: string | null | undefined;
    try {
      raw = storage?.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
    } catch {
      return undefined;
    }
    const attempt = parseCheckoutAttempt(raw, now());
    if (raw && !attempt) clear();
    return attempt;
  }
  function write(attempt: CheckoutAttempt) {
    try {
      storage?.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
    } catch {
      // The in-memory attempt still protects the current page.
    }
  }
  return {
    clear,
    discard(idempotencyKey) {
      if (read()?.idempotencyKey === idempotencyKey) clear();
    },
    markSettled(purchaseId) {
      const attempt = read();
      if (attempt?.purchaseId === purchaseId && !attempt.settledAtUtc) {
        write({ ...attempt, settledAtUtc: now().toISOString() });
      }
    },
    read,
    write,
  };
}

/** Raw stored value for `useSyncExternalStore` snapshots. */
export function readStoredCheckoutAttempt(): string | null {
  try {
    return window.localStorage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Notifies when another tab changes the stored attempt. */
export function subscribeToStoredCheckoutAttempt(
  onChange: () => void,
): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key === null || event.key === CHECKOUT_ATTEMPT_STORAGE_KEY) {
      onChange();
    }
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

/**
 * Browser-scoped store shared by every tab of this origin, so a hosted
 * checkout can return in a new tab or after the original tab was closed.
 * Logout clears it; attempts also expire after `CHECKOUT_ATTEMPT_MAX_AGE_MS`.
 */
export function browserCheckoutAttemptStore(): CheckoutAttemptStore {
  return createCheckoutAttemptStore(
    typeof window === "undefined" ? undefined : safeLocalStorage(),
  );
}

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function createIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}
