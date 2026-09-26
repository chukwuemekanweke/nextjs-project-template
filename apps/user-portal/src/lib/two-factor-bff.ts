import type {
  AuthenticatedSessionResponse,
  SignInResponse,
  TwoFactorRequiredResponse,
} from "@template/api-client/authentication";

const TERMINAL_CHALLENGE_CODES = new Set([
  "two_factor_challenge_consumed",
  "two_factor_challenge_exhausted",
  "two_factor_challenge_expired",
  "two_factor_challenge_invalid",
]);

export function isAuthenticatedSessionResponse(
  response: SignInResponse,
): response is AuthenticatedSessionResponse {
  return response.outcome === "authenticated";
}

export function isTwoFactorRequiredResponse(response: {
  outcome: string;
}): response is TwoFactorRequiredResponse {
  return response.outcome === "two_factor_required";
}

export function safeSessionResponse(session: AuthenticatedSessionResponse) {
  return {
    expiresAtUtc: session.expiresAtUtc,
    status: "authenticated" as const,
    tokenType: session.tokenType,
  };
}

export function safeTwoFactorRequiredResponse(
  challenge: TwoFactorRequiredResponse,
) {
  return {
    expiresAtUtc: challenge.challengeExpiresAtUtc,
    status: "two_factor_required" as const,
  };
}

export function isTerminalTwoFactorChallengeCode(
  code: string | undefined,
): boolean {
  return code !== undefined && TERMINAL_CHALLENGE_CODES.has(code);
}
