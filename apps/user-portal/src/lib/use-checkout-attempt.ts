"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseCheckoutAttempt,
  readStoredCheckoutAttempt,
  subscribeToStoredCheckoutAttempt,
  type CheckoutAttempt,
} from "./checkout-attempt";

/**
 * The remembered checkout attempt for this browser (kept in sync across tabs): `undefined` while server
 * rendering/hydrating, `null` when none is remembered. Navigation state only.
 */
export function useRememberedCheckoutAttempt():
  CheckoutAttempt | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribeToStoredCheckoutAttempt,
    readStoredCheckoutAttempt,
    () => undefined,
  );
  return useMemo(
    () => (raw === undefined ? undefined : (parseCheckoutAttempt(raw) ?? null)),
    [raw],
  );
}
