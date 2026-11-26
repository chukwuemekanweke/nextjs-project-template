"use client";

import {
  useCompletePasskeyRegistration,
  useCreatePasskeyRegistrationOptions,
  usePasskeys,
} from "@template/api-react/authentication";
import {
  Alert,
  Button,
  CheckIcon,
  FingerprintIcon,
  FormField,
  Input,
  Skeleton,
} from "@template/ui-core";
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

const passkeyBenefits = [
  "Works with Face ID, Touch ID, Windows Hello and Android",
  "You can add more devices later in Security settings",
  "Your current sign-in method keeps working",
] as const;

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
      <>
        <Alert title="Passkeys aren't supported here" variant="warning">
          This browser cannot create passkeys. You can add one later from your
          Security settings on a supported device.
        </Alert>
        <Button fullWidth onClick={continueToApp}>
          Continue
        </Button>
      </>
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
  const descriptionId = useId();
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
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      <ul className="text-body text-fg-muted flex flex-col gap-3">
        {passkeyBenefits.map((benefit) => (
          <li className="flex items-start gap-2.5" key={benefit}>
            <CheckIcon className="text-brand-ink mt-0.5" size="sm" />
            {benefit}
          </li>
        ))}
      </ul>
      {error ? (
        <Alert title="Passkey not created" variant="error">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert title="Passkey cancelled" variant="info">
          {notice}
        </Alert>
      ) : null}
      <FormField
        descriptionId={descriptionId}
        error={fieldError}
        hint="Helps you recognise this passkey later."
        inputId={inputId}
        label="Passkey name"
        required
      >
        <Input
          aria-describedby={descriptionId}
          aria-invalid={fieldError ? true : undefined}
          autoComplete="off"
          disabled={registering}
          id={inputId}
          maxLength={PASSKEY_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </FormField>
      <div className="flex flex-col gap-3">
        <Button
          fullWidth
          leadingIcon={<FingerprintIcon />}
          loading={registering}
          type="submit"
        >
          {registering ? "Waiting for your authenticator…" : "Create passkey"}
        </Button>
        <Button
          disabled={registering}
          fullWidth
          onClick={onSkip}
          variant="ghost"
        >
          Skip for now
        </Button>
      </div>
    </form>
  );
}

function PasskeySetupSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Preparing passkey setup"
      className="flex flex-col gap-4"
      role="status"
    >
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
