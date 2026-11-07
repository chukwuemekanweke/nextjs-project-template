"use client";

import {
  useCompletePasskeyRegistration,
  useCreatePasskeyRegistrationOptions,
  usePasskeys,
} from "@template/api-react/authentication";
import { Alert, Skeleton } from "@template/ui-core";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  PASSKEY_NAME_MAX_LENGTH,
  registerPasskey,
  validatePasskeyName,
} from "@/lib/passkey-management";
import { rememberPasskeyAdded, suggestPasskeyName } from "@/lib/passkey-setup";
import { useWebAuthnSupport } from "@/lib/use-webauthn-support";

type SetupState = "idle" | "registering" | "registered";

const primaryButton =
  "bg-brand-500 hover:bg-brand-600 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

/**
 * Optional passkey enrolment offered once after registration. Skipping, an
 * unsupported browser, or an existing passkey all continue to the destination.
 */
export function PasskeySetupPrompt({
  destination,
}: Readonly<{ destination: string }>) {
  const router = useRouter();
  const supported = useWebAuthnSupport();
  const passkeys = usePasskeys();
  const [state, setState] = useState<SetupState>("idle");

  const continueToApp = useCallback(() => {
    router.replace(destination);
    router.refresh();
  }, [destination, router]);

  const alreadyEnrolled = state === "idle" && (passkeys.data?.length ?? 0) > 0;

  useEffect(() => {
    if (alreadyEnrolled) {
      continueToApp();
    }
  }, [alreadyEnrolled, continueToApp]);

  if (
    supported === undefined ||
    passkeys.isPending ||
    alreadyEnrolled ||
    state === "registered"
  ) {
    return <PasskeySetupSkeleton />;
  }

  if (!supported) {
    return (
      <div className="space-y-5">
        <Alert variant="info">
          This browser cannot create passkeys. You can add one later from your
          Security settings on a supported device.
        </Alert>
        <button className={primaryButton} onClick={continueToApp} type="button">
          Continue
        </button>
      </div>
    );
  }

  return (
    <PasskeySetupForm
      onRegistered={(name) => {
        // The destination page confirms the new passkey in a modal.
        rememberPasskeyAdded(name);
        setState("registered");
        continueToApp();
      }}
      onRegistering={(registering) =>
        setState(registering ? "registering" : "idle")
      }
      onSkip={continueToApp}
      registering={state === "registering"}
    />
  );
}

function PasskeySetupForm({
  onRegistered,
  onRegistering,
  onSkip,
  registering,
}: Readonly<{
  onRegistered: (name: string) => void;
  onRegistering: (registering: boolean) => void;
  onSkip: () => void;
  registering: boolean;
}>) {
  const createOptions = useCreatePasskeyRegistrationOptions();
  const completeRegistration = useCompletePasskeyRegistration();
  const inputId = useId();
  const fieldErrorId = useId();
  // Mounted only after WebAuthn support is known, so navigator is available.
  const [name, setName] = useState(() =>
    suggestPasskeyName(globalThis.navigator?.userAgent ?? ""),
  );
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const active = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current) return;
    const problem = validatePasskeyName(name);
    setFieldError(problem);
    if (problem) return;

    active.current = true;
    setError(undefined);
    setNotice(undefined);
    onRegistering(true);
    let registered = false;
    try {
      const result = await registerPasskey(name, {
        complete: completeRegistration.mutateAsync,
        createOptions: createOptions.mutateAsync,
      });
      if (result.status === "registered") {
        registered = true;
        onRegistered(result.passkey.name);
      } else if (result.status === "cancelled") {
        setNotice(
          "Passkey creation was cancelled. Try again, or skip for now.",
        );
      } else {
        setError(result.message);
      }
    } finally {
      active.current = false;
      if (!registered) onRegistering(false);
    }
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      {notice ? (
        <p className="text-sm text-gray-600 dark:text-gray-400" role="status">
          {notice}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <label
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor={inputId}
        >
          Passkey name
        </label>
        <input
          aria-describedby={fieldError ? fieldErrorId : undefined}
          aria-invalid={fieldError ? true : undefined}
          autoComplete="off"
          className="focus:border-brand-300 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:text-white/90"
          disabled={registering}
          id={inputId}
          maxLength={PASSKEY_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
        {fieldError ? (
          <p
            className="text-sm text-red-600 dark:text-red-400"
            id={fieldErrorId}
          >
            {fieldError}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Helps you recognise this passkey later.
          </p>
        )}
      </div>
      <div className="space-y-3">
        <button
          aria-busy={registering || undefined}
          className={primaryButton}
          disabled={registering}
          type="submit"
        >
          {registering ? "Waiting for your authenticator…" : "Create passkey"}
        </button>
        <button
          className={secondaryButton}
          disabled={registering}
          onClick={onSkip}
          type="button"
        >
          Skip for now
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        You can add or manage passkeys any time in Security settings.
      </p>
    </form>
  );
}

function PasskeySetupSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Preparing passkey setup"
      className="space-y-4"
      role="status"
    >
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
