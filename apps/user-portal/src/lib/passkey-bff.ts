import type {
  PasskeyAuthenticatedResponse,
  PasskeySignInResponse,
  SessionTokenResponse,
} from "@template/api-client/authentication";

export const NO_STORE_HEADERS = { "cache-control": "no-store" } as const;

export function isAuthenticatedPasskeyResponse(
  response: PasskeySignInResponse,
): response is PasskeyAuthenticatedResponse {
  return response.outcome === "authenticated";
}

/**
 * The passkey endpoint names the access-token expiry `accessTokenExpiresAtUtc`;
 * adapt it to the shared session shape so the normal cookie writer is reused.
 */
export function passkeySessionTokens(
  session: PasskeyAuthenticatedResponse,
): SessionTokenResponse {
  return {
    accessToken: session.accessToken,
    expiresAtUtc: session.accessTokenExpiresAtUtc,
    refreshToken: session.refreshToken,
    refreshTokenExpiresAtUtc: session.refreshTokenExpiresAtUtc,
    tokenType: session.tokenType,
  };
}

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
