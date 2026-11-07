import type {
  AuthenticationResponseJson,
  PublicKeyCredentialCreationOptionsJson,
  PublicKeyCredentialDescriptorJson,
  PublicKeyCredentialRequestOptionsJson,
  RegistrationResponseJson,
} from "../authentication/contracts";

/**
 * Browser WebAuthn helpers. They only translate between the WebAuthn JSON wire
 * format and native browser objects; challenge and signature verification are
 * always performed by the backend.
 */

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/;

export class WebAuthnSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebAuthnSerializationError";
  }
}

export function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  if (!BASE64URL_PATTERN.test(value) || value.length % 4 === 1) {
    throw new WebAuthnSerializationError("Value is not valid base64url.");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64Url(
  value: ArrayBuffer | ArrayBufferView,
): string {
  const bytes =
    value instanceof ArrayBuffer
      ? new Uint8Array(value)
      : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toCredentialDescriptor(
  descriptor: PublicKeyCredentialDescriptorJson,
): PublicKeyCredentialDescriptor {
  return {
    id: base64UrlToArrayBuffer(descriptor.id),
    type: descriptor.type,
    ...(descriptor.transports
      ? { transports: descriptor.transports as AuthenticatorTransport[] }
      : {}),
  };
}

export function toPublicKeyCredentialCreationOptions(
  options: PublicKeyCredentialCreationOptionsJson,
): PublicKeyCredentialCreationOptions {
  const { authenticatorSelection } = options;
  return {
    challenge: base64UrlToArrayBuffer(options.challenge),
    pubKeyCredParams: options.pubKeyCredParams,
    rp: options.rp,
    user: {
      displayName: options.user.displayName,
      id: base64UrlToArrayBuffer(options.user.id),
      name: options.user.name,
    },
    ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
    ...(options.attestation
      ? { attestation: options.attestation as AttestationConveyancePreference }
      : {}),
    ...(authenticatorSelection
      ? {
          authenticatorSelection: {
            ...authenticatorSelection,
            authenticatorAttachment:
              authenticatorSelection.authenticatorAttachment as
                AuthenticatorAttachment | undefined,
            residentKey: authenticatorSelection.residentKey as
              ResidentKeyRequirement | undefined,
            userVerification: authenticatorSelection.userVerification as
              UserVerificationRequirement | undefined,
          },
        }
      : {}),
    ...(options.excludeCredentials
      ? {
          excludeCredentials: options.excludeCredentials.map(
            toCredentialDescriptor,
          ),
        }
      : {}),
    ...(options.extensions
      ? {
          extensions:
            options.extensions as AuthenticationExtensionsClientInputs,
        }
      : {}),
  };
}

export function toPublicKeyCredentialRequestOptions(
  options: PublicKeyCredentialRequestOptionsJson,
): PublicKeyCredentialRequestOptions {
  return {
    challenge: base64UrlToArrayBuffer(options.challenge),
    ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
    ...(options.rpId ? { rpId: options.rpId } : {}),
    ...(options.userVerification
      ? {
          userVerification:
            options.userVerification as UserVerificationRequirement,
        }
      : {}),
    ...(options.allowCredentials
      ? {
          allowCredentials: options.allowCredentials.map(
            toCredentialDescriptor,
          ),
        }
      : {}),
    ...(options.extensions
      ? {
          extensions:
            options.extensions as AuthenticationExtensionsClientInputs,
        }
      : {}),
  };
}

/** Converts extension output to JSON, encoding any binary members as base64url. */
function toJsonValue(value: unknown): unknown {
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return arrayBufferToBase64Url(value);
  }
  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)]),
    );
  }
  return value;
}

/** Minimal structural view of the browser credential, so tests need no DOM. */
export type WebAuthnCredential = {
  authenticatorAttachment?: string | null;
  getClientExtensionResults?: () => object;
  id: string;
  rawId: ArrayBuffer;
  response: object;
  type: string;
};

type AttestationResponseView = {
  attestationObject: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  getAuthenticatorData?: () => ArrayBuffer;
  getPublicKey?: () => ArrayBuffer | null;
  getPublicKeyAlgorithm?: () => number;
  getTransports?: () => string[];
};

type AssertionResponseView = {
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle?: ArrayBuffer | null;
};

function isBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

function hasBuffers<T extends object>(
  response: object,
  keys: string[],
): response is T {
  const record = response as Record<string, unknown>;
  return keys.every((key) => isBuffer(record[key]));
}

function assertPublicKeyCredential(credential: WebAuthnCredential): void {
  if (
    credential.type !== "public-key" ||
    !credential.id ||
    !isBuffer(credential.rawId)
  ) {
    throw new WebAuthnSerializationError(
      "The authenticator returned an invalid credential.",
    );
  }
}

function credentialBase(credential: WebAuthnCredential) {
  return {
    clientExtensionResults: toJsonValue(
      credential.getClientExtensionResults?.() ?? {},
    ) as Record<string, unknown>,
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: "public-key" as const,
    ...(credential.authenticatorAttachment
      ? { authenticatorAttachment: credential.authenticatorAttachment }
      : {}),
  };
}

export function serializeRegistrationCredential(
  credential: WebAuthnCredential,
): RegistrationResponseJson {
  assertPublicKeyCredential(credential);
  const response = credential.response;
  if (
    !hasBuffers<AttestationResponseView>(response, [
      "attestationObject",
      "clientDataJSON",
    ])
  ) {
    throw new WebAuthnSerializationError(
      "The authenticator returned an invalid registration response.",
    );
  }

  const transports = response.getTransports?.();
  const publicKeyAlgorithm = response.getPublicKeyAlgorithm?.();
  const publicKey = response.getPublicKey?.();
  const authenticatorData = response.getAuthenticatorData?.();
  return {
    ...credentialBase(credential),
    response: {
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      ...(Array.isArray(transports) ? { transports: [...transports] } : {}),
      ...(typeof publicKeyAlgorithm === "number" ? { publicKeyAlgorithm } : {}),
      ...(isBuffer(publicKey)
        ? { publicKey: arrayBufferToBase64Url(publicKey) }
        : {}),
      ...(isBuffer(authenticatorData)
        ? { authenticatorData: arrayBufferToBase64Url(authenticatorData) }
        : {}),
    },
  };
}

export function serializeAuthenticationCredential(
  credential: WebAuthnCredential,
): AuthenticationResponseJson {
  assertPublicKeyCredential(credential);
  const response = credential.response;
  if (
    !hasBuffers<AssertionResponseView>(response, [
      "authenticatorData",
      "clientDataJSON",
      "signature",
    ])
  ) {
    throw new WebAuthnSerializationError(
      "The authenticator returned an invalid sign-in response.",
    );
  }

  return {
    ...credentialBase(credential),
    response: {
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      signature: arrayBufferToBase64Url(response.signature),
      ...(isBuffer(response.userHandle) && response.userHandle.byteLength > 0
        ? { userHandle: arrayBufferToBase64Url(response.userHandle) }
        : {}),
    },
  };
}

export type WebAuthnEnvironment = {
  credentials?: Pick<CredentialsContainer, "create" | "get">;
  isSecureContext?: boolean;
  publicKeyCredential?: unknown;
};

function browserEnvironment(): WebAuthnEnvironment {
  if (typeof window === "undefined") {
    return {};
  }
  return {
    credentials: window.navigator.credentials,
    isSecureContext: window.isSecureContext,
    publicKeyCredential: window.PublicKeyCredential,
  };
}

/** Progressive-enhancement check; false on the server and insecure origins. */
export function isWebAuthnSupported(
  environment: WebAuthnEnvironment = browserEnvironment(),
): boolean {
  return (
    environment.isSecureContext === true &&
    typeof environment.publicKeyCredential === "function" &&
    typeof environment.credentials?.create === "function" &&
    typeof environment.credentials.get === "function"
  );
}

export type WebAuthnFailureReason =
  | "cancelled"
  | "credential_exists"
  | "invalid_response"
  | "not_supported"
  | "security"
  | "unknown";

export class WebAuthnCeremonyError extends Error {
  readonly reason: WebAuthnFailureReason;

  constructor(reason: WebAuthnFailureReason, message: string) {
    super(message);
    this.name = "WebAuthnCeremonyError";
    this.reason = reason;
  }
}

/**
 * Maps native WebAuthn DOMException names to stable reasons. Browsers report
 * user cancellation, timeouts, and "no matching passkey" identically as
 * NotAllowedError by design, so those are all treated as `cancelled`.
 */
export function classifyWebAuthnError(error: unknown): WebAuthnFailureReason {
  if (error instanceof WebAuthnCeremonyError) {
    return error.reason;
  }
  if (error instanceof WebAuthnSerializationError) {
    return "invalid_response";
  }
  const name =
    error && typeof error === "object" && "name" in error
      ? (error as { name: unknown }).name
      : undefined;
  switch (name) {
    case "NotAllowedError":
    case "AbortError":
      return "cancelled";
    case "InvalidStateError":
      return "credential_exists";
    case "NotSupportedError":
      return "not_supported";
    case "SecurityError":
      return "security";
    default:
      return "unknown";
  }
}

function requireEnvironment(environment: WebAuthnEnvironment) {
  if (!isWebAuthnSupported(environment) || !environment.credentials) {
    throw new WebAuthnCeremonyError(
      "not_supported",
      "Passkeys are not supported in this browser.",
    );
  }
  return environment.credentials;
}

async function runCeremony<T>(
  invoke: () => Promise<Credential | null>,
  serialize: (credential: WebAuthnCredential) => T,
): Promise<T> {
  let credential: Credential | null;
  try {
    credential = await invoke();
  } catch (error) {
    throw new WebAuthnCeremonyError(
      classifyWebAuthnError(error),
      "The passkey request did not complete.",
    );
  }
  if (!credential) {
    throw new WebAuthnCeremonyError(
      "cancelled",
      "The passkey request did not complete.",
    );
  }
  try {
    return serialize(credential as unknown as WebAuthnCredential);
  } catch {
    throw new WebAuthnCeremonyError(
      "invalid_response",
      "The authenticator returned an invalid response.",
    );
  }
}

/** Runs `navigator.credentials.create()` and serializes the attestation. */
export async function createPasskeyCredential(
  options: PublicKeyCredentialCreationOptionsJson,
  {
    environment = browserEnvironment(),
    signal,
  }: { environment?: WebAuthnEnvironment; signal?: AbortSignal } = {},
): Promise<RegistrationResponseJson> {
  const credentials = requireEnvironment(environment);
  const publicKey = toPublicKeyCredentialCreationOptions(options);
  return runCeremony(
    () => credentials.create({ publicKey, signal }),
    serializeRegistrationCredential,
  );
}

/** Runs `navigator.credentials.get()` and serializes the assertion. */
export async function getPasskeyAssertion(
  options: PublicKeyCredentialRequestOptionsJson,
  {
    environment = browserEnvironment(),
    signal,
  }: { environment?: WebAuthnEnvironment; signal?: AbortSignal } = {},
): Promise<AuthenticationResponseJson> {
  const credentials = requireEnvironment(environment);
  const publicKey = toPublicKeyCredentialRequestOptions(options);
  return runCeremony(
    () => credentials.get({ publicKey, signal }),
    serializeAuthenticationCredential,
  );
}
