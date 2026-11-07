"use client";

import { useRef, useState } from "react";
import {
  signInWithPasskey,
  type PasskeySignInResult,
} from "@/lib/passkey-sign-in";
import { useWebAuthnSupport } from "@/lib/use-webauthn-support";

export function PasskeySignInButton({
  disabled,
  onOutcome,
  onPendingChange,
}: Readonly<{
  disabled?: boolean;
  onOutcome: (result: PasskeySignInResult) => void;
  onPendingChange?: (pending: boolean) => void;
}>) {
  const supported = useWebAuthnSupport();
  const [pending, setPending] = useState(false);
  const active = useRef(false);

  async function start() {
    if (active.current) return;
    active.current = true;
    setPending(true);
    onPendingChange?.(true);
    try {
      onOutcome(await signInWithPasskey());
    } finally {
      active.current = false;
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        aria-describedby={
          supported === false ? "passkey-unsupported" : undefined
        }
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        disabled={disabled || pending || supported !== true}
        onClick={() => void start()}
        type="button"
      >
        <PasskeyIcon />
        {pending ? "Waiting for your passkey…" : "Sign in with passkey"}
      </button>
      {supported === false ? (
        <p
          className="text-center text-xs text-gray-500 dark:text-gray-400"
          id="passkey-unsupported"
        >
          Passkeys are not available in this browser. Use another sign-in
          method.
        </p>
      ) : null}
    </div>
  );
}

function PasskeyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-1a6 6 0 0 1 9-5.2" />
      <circle cx="17.5" cy="13.5" r="2.5" />
      <path d="M17.5 16v5l1.5-1.5M17.5 19h1.5" />
    </svg>
  );
}
