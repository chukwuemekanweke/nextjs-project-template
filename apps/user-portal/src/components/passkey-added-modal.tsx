"use client";

import { Modal } from "@template/ui-core";
import { useEffect, useState } from "react";
import { takePasskeyAdded } from "@/lib/passkey-setup";

/**
 * One-time confirmation shown on the first authenticated page after passkey
 * setup completes during onboarding.
 */
export function PasskeyAddedModal() {
  const [name, setName] = useState<string>();

  useEffect(() => {
    // Read after hydration: browser storage is not available on the server.
    // The read also clears the notice, so a repeated effect run (React Strict
    // Mode) finds nothing; it must not overwrite the name already taken.
    const pending = takePasskeyAdded();
    if (pending !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(pending);
    }
  }, []);

  return <PasskeyAddedDialog name={name} onClose={() => setName(undefined)} />;
}

export function PasskeyAddedDialog({
  name,
  onClose,
}: Readonly<{ name: string | undefined; onClose: () => void }>) {
  return (
    <Modal
      description={`“${name ?? ""}” is ready. Next time you sign in, choose Sign in with passkey.`}
      onClose={onClose}
      open={name !== undefined}
      size="compact"
      title="Passkey added"
    >
      <div className="flex justify-end">
        <button
          autoFocus
          className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          onClick={onClose}
          type="button"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
