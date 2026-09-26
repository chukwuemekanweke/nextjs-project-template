export const TERMINAL_TWO_FACTOR_CODES = new Set([
  "two_factor_challenge_consumed",
  "two_factor_challenge_exhausted",
  "two_factor_challenge_expired",
  "two_factor_challenge_invalid",
]);

export type TwoFactorBrowserError = {
  message: string;
  restartRequired: boolean;
};

export async function twoFactorErrorFromResponse(
  response: Response,
): Promise<TwoFactorBrowserError> {
  let code: string | undefined;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const suppliedCode = (body as { code?: unknown }).code;
      code = typeof suppliedCode === "string" ? suppliedCode : undefined;
    }
  } catch {
    // Error bodies are untrusted and may be empty.
  }

  if (TERMINAL_TWO_FACTOR_CODES.has(code ?? "") || response.status === 410) {
    return {
      message: "This verification request is no longer valid. Restart sign-in.",
      restartRequired: true,
    };
  }
  if (code === "invalid_two_factor_code" || response.status === 401) {
    return {
      message: "That verification code is incorrect. Try again.",
      restartRequired: false,
    };
  }
  if (code === "account_locked" || response.status === 423) {
    return {
      message: "This account is temporarily locked. Restart sign-in later.",
      restartRequired: true,
    };
  }
  if (code === "rate_limited" || response.status === 429) {
    return {
      message: "Too many verification attempts. Try again later.",
      restartRequired: false,
    };
  }
  return {
    message: "Verification is temporarily unavailable. Try again.",
    restartRequired: false,
  };
}
