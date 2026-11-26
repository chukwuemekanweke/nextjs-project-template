"use client";

import { Button, FingerprintIcon } from "@template/ui-core";
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
    <div className="flex flex-col gap-2">
      <Button
        aria-describedby={
          supported === false ? "passkey-unsupported" : undefined
        }
        disabled={disabled || supported !== true}
        fullWidth
        leadingIcon={<FingerprintIcon />}
        loading={pending}
        onClick={() => void start()}
        variant="secondary"
      >
        {pending ? "Waiting for your passkey…" : "Sign in with passkey"}
      </Button>
      {supported === false ? (
        <p
          className="text-small text-fg-muted text-center"
          id="passkey-unsupported"
        >
          Passkeys aren&apos;t supported in this browser. Use another sign-in
          method.
        </p>
      ) : null}
    </div>
  );
}
