import type {
  AuthenticationResponseJson,
  PublicKeyCredentialRequestOptionsJson,
} from "@template/api-client/authentication";
import {
  classifyWebAuthnError,
  getPasskeyAssertion,
} from "@template/api-client/browser";

export const PASSKEY_OPTIONS_PATH = "/api/auth/passkey/options";
export const PASSKEY_SESSION_PATH = "/api/auth/session/passkey";

export type PasskeySignInResult =
  | { status: "authenticated" }
  | { status: "two_factor_required" }
  | { status: "cancelled" }
  | { message: string; status: "error" };

export interface PasskeySignInDependencies {
  fetch?: typeof globalThis.fetch;
  getAssertion?: (
    options: PublicKeyCredentialRequestOptionsJson,
  ) => Promise<AuthenticationResponseJson>;
}

const UNAVAILABLE =
  "Passkey sign-in is temporarily unavailable. Try again or use another sign-in method.";

/** Maps BFF status codes for passkey sign-in to safe, passkey-specific copy. */
export function passkeySignInError(status: number): string {
  switch (status) {
    case 400:
    case 401:
      return "That passkey could not be verified. Try again or use another passkey.";
    case 403:
      return "This passkey cannot be used to sign in right now. Sign in with your email and password instead.";
    case 409:
    case 410:
      return "The passkey request expired. Try again.";
    case 423:
      return "This account is temporarily locked. Try again later.";
    case 429:
      return "Too many sign-in attempts. Try again later.";
    case 0:
      return "We could not reach the server. Check your connection and try again.";
    default:
      return UNAVAILABLE;
  }
}

/** Maps a browser WebAuthn failure to a result; cancellation is not an error. */
export function passkeyCeremonyResult(error: unknown): PasskeySignInResult {
  switch (classifyWebAuthnError(error)) {
    case "cancelled":
      return { status: "cancelled" };
    case "not_supported":
      return {
        message:
          "This browser or device does not support passkeys. Use another sign-in method.",
        status: "error",
      };
    case "security":
      return {
        message:
          "Passkeys are not available on this address. Use another sign-in method.",
        status: "error",
      };
    case "invalid_response":
      return {
        message:
          "Your authenticator returned an unexpected response. Try again or use another passkey.",
        status: "error",
      };
    default:
      return {
        message:
          "Your authenticator could not complete the request. Try again or use another sign-in method.",
        status: "error",
      };
  }
}

async function postJson(
  fetchImplementation: typeof globalThis.fetch,
  path: string,
  body?: unknown,
): Promise<Response> {
  return fetchImplementation(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    headers:
      body === undefined ? undefined : { "content-type": "application/json" },
    method: "POST",
  });
}

/**
 * Discoverable (username-less) passkey sign-in. The browser only obtains the
 * assertion; the BFF holds the flow token and creates the session cookies.
 */
export async function signInWithPasskey({
  fetch: fetchImplementation = globalThis.fetch.bind(globalThis),
  getAssertion = getPasskeyAssertion,
}: PasskeySignInDependencies = {}): Promise<PasskeySignInResult> {
  let options: PublicKeyCredentialRequestOptionsJson;
  try {
    const response = await postJson(fetchImplementation, PASSKEY_OPTIONS_PATH);
    if (!response.ok) {
      return { message: passkeySignInError(response.status), status: "error" };
    }
    options = (
      (await response.json()) as {
        publicKey: PublicKeyCredentialRequestOptionsJson;
      }
    ).publicKey;
  } catch {
    return { message: passkeySignInError(0), status: "error" };
  }

  let credential: AuthenticationResponseJson;
  try {
    credential = await getAssertion(options);
  } catch (error) {
    // Release the single-use flow cookie; failures here are not actionable.
    void fetchImplementation(PASSKEY_SESSION_PATH, {
      credentials: "same-origin",
      method: "DELETE",
    }).catch(() => undefined);
    return passkeyCeremonyResult(error);
  }

  try {
    const response = await postJson(fetchImplementation, PASSKEY_SESSION_PATH, {
      credential,
    });
    if (!response.ok) {
      return { message: passkeySignInError(response.status), status: "error" };
    }
    const result = (await response.json()) as { status?: unknown };
    if (result.status === "two_factor_required") {
      return { status: "two_factor_required" };
    }
    if (result.status === "authenticated") {
      return { status: "authenticated" };
    }
    return { message: UNAVAILABLE, status: "error" };
  } catch {
    return { message: passkeySignInError(0), status: "error" };
  }
}
