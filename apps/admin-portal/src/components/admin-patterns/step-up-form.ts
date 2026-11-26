/*
 * Pure validation and submission rules for the admin step-up dialog. The
 * dialog only collects input: verifying the code, enforcing freshness and
 * performing the privileged action are the backend's job, through the
 * caller's `onSubmit`.
 */

export type StepUpReasonConfig = Readonly<{
  /** For example "Reason (recorded in audit history)". */
  label: string;
  required: boolean;
  /** Defaults to 500 characters. */
  maxLength?: number;
  hint?: string;
}>;

export type StepUpConfig = Readonly<{
  /** Digits in the authenticator code; TOTP apps use 6. */
  codeLength: number;
  /** Omit when the backend contract takes no reason. */
  reason?: StepUpReasonConfig;
}>;

export type StepUpValues = Readonly<{ code: string; reason: string }>;
export type StepUpErrors = Readonly<{ code?: string; reason?: string }>;

/** What the caller receives; `reason` only when the contract has one. */
export type StepUpSubmission = Readonly<{ code: string; reason?: string }>;

export type StepUpSubmitDecision =
  | Readonly<{ kind: "blocked" }>
  | Readonly<{ kind: "invalid"; errors: StepUpErrors }>
  | Readonly<{ kind: "submit"; submission: StepUpSubmission }>;

export const DEFAULT_REASON_MAX_LENGTH = 500;

/** Keeps digits only (paste "123 456" → "123456"). */
export function normalizeStepUpCode(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateStepUp(
  values: StepUpValues,
  config: StepUpConfig,
): StepUpErrors {
  const errors: { code?: string; reason?: string } = {};
  const code = normalizeStepUpCode(values.code);
  if (code.length !== config.codeLength) {
    errors.code = `Enter the ${config.codeLength}-digit code from your authenticator app.`;
  }
  if (config.reason) {
    const reason = values.reason.trim();
    const maxLength = config.reason.maxLength ?? DEFAULT_REASON_MAX_LENGTH;
    if (config.reason.required && !reason) {
      errors.reason = "Enter a reason for this action.";
    } else if (reason.length > maxLength) {
      errors.reason = `Keep the reason under ${maxLength + 1} characters.`;
    }
  }
  return errors;
}

/**
 * Decides what a submit attempt does. While `pending` it is blocked, so a
 * double click or a second Enter never sends the code twice.
 */
export function decideStepUpSubmit(
  values: StepUpValues,
  config: StepUpConfig,
  pending: boolean,
): StepUpSubmitDecision {
  if (pending) return { kind: "blocked" };
  const errors = validateStepUp(values, config);
  if (errors.code || errors.reason) return { errors, kind: "invalid" };
  const reason = values.reason.trim();
  return {
    kind: "submit",
    submission: {
      code: normalizeStepUpCode(values.code),
      ...(config.reason && reason ? { reason } : {}),
    },
  };
}
