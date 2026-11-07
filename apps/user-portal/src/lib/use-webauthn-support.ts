"use client";

import { isWebAuthnSupported } from "@template/api-client/browser";
import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * `undefined` while server rendering/hydrating, then whether this browser
 * offers WebAuthn in a secure context. Callers keep other sign-in methods
 * usable regardless of the result.
 */
export function useWebAuthnSupport(): boolean | undefined {
  return useSyncExternalStore<boolean | undefined>(
    subscribe,
    () => isWebAuthnSupported(),
    () => undefined,
  );
}
