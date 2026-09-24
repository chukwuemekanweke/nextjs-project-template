export const GOOGLE_AUTH_ERROR_CODES = {
  accountLocked: "account_locked",
  emailVerificationRequired: "email_verification_required",
  flowConsumed: "google_flow_consumed",
  flowExpired: "google_flow_expired",
  flowInvalid: "google_flow_invalid",
  invalidCredential: "invalid_google_credential",
  invalidCredentials: "invalid_credentials",
  rateLimited: "rate_limited",
} as const;

export type GoogleAuthenticationOutcome =
  | {
      expiresAtUtc: string;
      status: "authenticated";
      tokenType: string;
    }
  | { status: "link_required" }
  | { status: "registration_required" };

export type GoogleAuthenticationError = {
  code?: string;
  message: string;
  restartRequired: boolean;
  validationErrors?: Readonly<Record<string, ReadonlyArray<string>>>;
};

export function googleAuthenticationError(
  code: string | undefined,
  status: number,
): GoogleAuthenticationError {
  if (
    code === GOOGLE_AUTH_ERROR_CODES.flowExpired ||
    code === GOOGLE_AUTH_ERROR_CODES.flowInvalid ||
    code === GOOGLE_AUTH_ERROR_CODES.flowConsumed
  ) {
    return {
      code,
      message: "Your Google sign-in attempt expired. Start again to continue.",
      restartRequired: true,
    };
  }
  if (code === GOOGLE_AUTH_ERROR_CODES.invalidCredential) {
    return {
      code,
      message: "Google could not verify this sign-in. Start again to continue.",
      restartRequired: true,
    };
  }
  if (code === GOOGLE_AUTH_ERROR_CODES.invalidCredentials || status === 401) {
    return {
      code,
      message: "The password is incorrect.",
      restartRequired: false,
    };
  }
  if (code === GOOGLE_AUTH_ERROR_CODES.accountLocked || status === 423) {
    return {
      code,
      message: "This account is temporarily locked. Try again later.",
      restartRequired: false,
    };
  }
  if (code === GOOGLE_AUTH_ERROR_CODES.emailVerificationRequired) {
    return {
      code,
      message: "Confirm your email address before continuing.",
      restartRequired: false,
    };
  }
  if (code === GOOGLE_AUTH_ERROR_CODES.rateLimited || status === 429) {
    return {
      code,
      message: "Too many attempts. Try again later.",
      restartRequired: false,
    };
  }
  return {
    code,
    message: "Google sign-in is temporarily unavailable. Try again later.",
    restartRequired: false,
  };
}

export async function googleErrorFromResponse(
  response: Response,
): Promise<GoogleAuthenticationError> {
  let code: string | undefined;
  let validationErrors:
    Readonly<Record<string, ReadonlyArray<string>>> | undefined;
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object") {
      const suppliedCode = (payload as { code?: unknown }).code;
      code = typeof suppliedCode === "string" ? suppliedCode : undefined;
      validationErrors = normalizeValidationErrors(
        (payload as { errors?: unknown }).errors,
      );
    }
  } catch {
    // Error responses are not trusted to have a JSON body.
  }
  return {
    ...googleAuthenticationError(code, response.status),
    ...(validationErrors ? { validationErrors } : {}),
  };
}

function normalizeValidationErrors(
  value: unknown,
): Readonly<Record<string, ReadonlyArray<string>>> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const errors = Object.fromEntries(
    Object.entries(value).flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) {
        return [];
      }
      const strings = messages.filter(
        (message): message is string => typeof message === "string",
      );
      return strings.length > 0 ? [[field, strings]] : [];
    }),
  );
  return Object.keys(errors).length > 0 ? errors : undefined;
}
