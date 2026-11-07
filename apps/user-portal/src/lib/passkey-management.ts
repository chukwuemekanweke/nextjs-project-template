import { isApiError } from "@template/api-client";
import type {
  CompletePasskeyRegistrationRequest,
  PasskeyRegistrationOptionsResponse,
  PasskeyResponse,
  PublicKeyCredentialCreationOptionsJson,
  RegistrationResponseJson,
} from "@template/api-client/authentication";
import {
  classifyWebAuthnError,
  createPasskeyCredential,
} from "@template/api-client/browser";

export const PASSKEY_NAME_MAX_LENGTH = 100;

export type PasskeyRegistrationResult =
  | { passkey: PasskeyResponse; status: "registered" }
  | { status: "cancelled" }
  | { message: string; status: "error" };

export interface PasskeyRegistrationDependencies {
  complete: (
    request: CompletePasskeyRegistrationRequest,
  ) => Promise<PasskeyResponse>;
  createCredential?: (
    options: PublicKeyCredentialCreationOptionsJson,
  ) => Promise<RegistrationResponseJson>;
  createOptions: (request: {
    name: string;
  }) => Promise<PasskeyRegistrationOptionsResponse>;
}

/** Returns a validation message, or undefined when the name is acceptable. */
export function validatePasskeyName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Enter a name for this passkey.";
  }
  if (trimmed.length > PASSKEY_NAME_MAX_LENGTH) {
    return `Use ${PASSKEY_NAME_MAX_LENGTH} characters or fewer.`;
  }
  return undefined;
}

function sessionError(error: unknown): string | undefined {
  if (!isApiError(error)) {
    return undefined;
  }
  if (error.isNetworkError) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (error.status === 401) {
    return "Your session has expired. Sign in again to manage passkeys.";
  }
  if (error.status === 403) {
    return "Your current session cannot manage passkeys. Sign out and sign in again.";
  }
  if (error.status === 429) {
    return "Too many requests. Wait a moment and try again.";
  }
  return undefined;
}

/** Safe copy for backend failures while starting or completing registration. */
export function passkeyRegistrationError(error: unknown): string {
  const shared = sessionError(error);
  if (shared) {
    return shared;
  }
  if (isApiError(error)) {
    if (error.status === 410) {
      return "The passkey request expired. Try adding the passkey again.";
    }
    if (error.status === 409) {
      return "This passkey is already registered, or the request was already used. Try again with a different authenticator.";
    }
    if (error.status === 400) {
      const nameErrors =
        error.validationErrors?.name ?? error.validationErrors?.Name;
      return nameErrors?.[0] ?? "The passkey could not be verified. Try again.";
    }
  }
  return "The passkey could not be added. Try again.";
}

function ceremonyError(error: unknown): PasskeyRegistrationResult {
  switch (classifyWebAuthnError(error)) {
    case "cancelled":
      return { status: "cancelled" };
    case "credential_exists":
      return {
        message:
          "This authenticator already has a passkey for your account. Use a different device or security key.",
        status: "error",
      };
    case "not_supported":
      return {
        message:
          "This browser or authenticator does not support the requested passkey type.",
        status: "error",
      };
    case "security":
      return {
        message: "Passkeys cannot be created on this address.",
        status: "error",
      };
    case "invalid_response":
      return {
        message:
          "Your authenticator returned an unexpected response. Try again.",
        status: "error",
      };
    default:
      return {
        message: "Your authenticator could not create the passkey. Try again.",
        status: "error",
      };
  }
}

/**
 * Registration ceremony: backend options, native credential creation, then
 * backend verification. Success is reported only after the backend confirms.
 */
export async function registerPasskey(
  name: string,
  {
    complete,
    createCredential = createPasskeyCredential,
    createOptions,
  }: PasskeyRegistrationDependencies,
): Promise<PasskeyRegistrationResult> {
  let flow: PasskeyRegistrationOptionsResponse;
  try {
    flow = await createOptions({ name: name.trim() });
  } catch (error) {
    return { message: passkeyRegistrationError(error), status: "error" };
  }

  let credential: RegistrationResponseJson;
  try {
    credential = await createCredential(flow.publicKey);
  } catch (error) {
    return ceremonyError(error);
  }

  try {
    const passkey = await complete({ credential, flowToken: flow.flowToken });
    return { passkey, status: "registered" };
  } catch (error) {
    return { message: passkeyRegistrationError(error), status: "error" };
  }
}

export function passkeyRenameError(error: unknown): string {
  const shared = sessionError(error);
  if (shared) {
    return shared;
  }
  if (isApiError(error)) {
    if (error.status === 404) {
      return "That passkey no longer exists.";
    }
    if (error.status === 400) {
      const nameErrors =
        error.validationErrors?.name ?? error.validationErrors?.Name;
      return nameErrors?.[0] ?? "Enter a valid passkey name.";
    }
  }
  return "The passkey could not be renamed. Try again.";
}

export function passkeyRemovalError(error: unknown): string {
  const shared = sessionError(error);
  if (shared) {
    return shared;
  }
  if (isApiError(error) && error.status === 404) {
    return "That passkey was already removed.";
  }
  return "The passkey could not be removed. Try again.";
}

export function passkeysLoadError(error: unknown): string {
  return (
    sessionError(error) ??
    "Passkeys could not be loaded. Refresh and try again."
  );
}

const TRANSPORT_LABELS: Readonly<Record<string, string>> = {
  ble: "Bluetooth",
  hybrid: "Phone or tablet",
  internal: "This device",
  nfc: "NFC",
  "smart-card": "Smart card",
  usb: "USB security key",
};

/** Human-readable authenticator hints derived only from backend transports. */
export function describePasskeyTransports(transports: string[]): string {
  const labels = [
    ...new Set(transports.map((transport) => TRANSPORT_LABELS[transport])),
  ].filter((label): label is string => Boolean(label));
  return labels.join(", ");
}

export function describePasskeyBackup(
  passkey: Pick<PasskeyResponse, "isBackedUp" | "isBackupEligible">,
): string | undefined {
  if (passkey.isBackedUp) {
    return "Synced";
  }
  if (passkey.isBackupEligible) {
    return "Can be synced";
  }
  return undefined;
}
