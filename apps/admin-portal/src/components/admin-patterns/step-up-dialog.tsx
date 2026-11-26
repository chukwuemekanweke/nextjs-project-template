"use client";

import {
  Alert,
  Button,
  Dialog,
  FieldError,
  FieldHint,
  FormField,
  FormLabel,
  Input,
  OtpInput,
  Panel,
} from "@template/ui-core";
import { useId, useState, type FormEvent } from "react";
import {
  DEFAULT_REASON_MAX_LENGTH,
  decideStepUpSubmit,
  normalizeStepUpCode,
  type StepUpErrors,
  type StepUpReasonConfig,
  type StepUpSubmission,
} from "./step-up-form";

const EMPTY_VALUES = { code: "", reason: "" } as const;

/**
 * Admin step-up confirmation (reference `AdminStepUp`): a fresh
 * authenticator code, and a reason when the action's contract records one,
 * before a privileged action. Presentation only — `onSubmit` receives the
 * input and the caller's backend call verifies it and performs the action;
 * this component never verifies codes, stores them, logs them or reports
 * success itself. Not the user-portal MFA or password-recovery flow.
 *
 * Behaviour: focus moves into the dialog and returns to the trigger
 * (ui-core `Dialog`); invalid input shows field errors and focuses the
 * first invalid field; while `pending` the dialog cannot be dismissed and
 * submission is blocked; a new `error` clears the code; cancelling or
 * closing clears all input.
 */
export function AdminStepUpDialog({
  action,
  codeLength = 6,
  confirmLabel,
  confirmTone = "danger",
  description,
  error,
  onCancel,
  onSubmit,
  open,
  pending = false,
  reason,
  title = "Confirm it's you",
  validityHint,
}: Readonly<{
  /** What will happen, for example "Lock Tunde Bakare" + consequence. */
  action: Readonly<{ title: string; description?: string }>;
  codeLength?: number;
  confirmLabel: string;
  confirmTone?: "danger" | "primary";
  /** Why a fresh check is needed, for example "Locking an account needs…". */
  description: string;
  /** Safe message from the caller's failed attempt (never a raw exception). */
  error?: string | null;
  onCancel: () => void;
  onSubmit: (submission: StepUpSubmission) => void;
  open: boolean;
  pending?: boolean;
  /** Omit when the backend contract takes no reason. */
  reason?: StepUpReasonConfig;
  title?: string;
  /** Validity copy from the backend contract; omitted when unknown. */
  validityHint?: string;
}>) {
  const id = useId();
  const formId = `${id}-form`;
  const codeId = `${id}-code`;
  const codeMessageId = `${id}-code-message`;
  const reasonId = `${id}-reason`;
  const reasonMessageId = `${id}-reason-message`;

  const [values, setValues] = useState<{ code: string; reason: string }>(
    EMPTY_VALUES,
  );
  const [errors, setErrors] = useState<StepUpErrors>({});
  const [previousOpen, setPreviousOpen] = useState(open);
  const [previousError, setPreviousError] = useState(error);

  // Clear sensitive input whenever the dialog closes, and the code after a
  // failed attempt (adjusting state on prop change, not in an effect).
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (!open) {
      setValues(EMPTY_VALUES);
      setErrors({});
    }
  }
  if (error !== previousError) {
    setPreviousError(error);
    if (error) setValues((current) => ({ ...current, code: "" }));
  }

  const config = { codeLength, reason };

  function cancel() {
    if (pending) return;
    setValues(EMPTY_VALUES);
    setErrors({});
    onCancel();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const decision = decideStepUpSubmit(values, config, pending);
    if (decision.kind === "blocked") return;
    if (decision.kind === "invalid") {
      setErrors(decision.errors);
      const firstInvalid = decision.errors.reason ? reasonId : `${codeId}-0`;
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setErrors({});
    onSubmit(decision.submission);
  }

  return (
    <Dialog
      description={description}
      dismissible={!pending}
      footer={
        <>
          <Button disabled={pending} onClick={cancel} variant="ghost">
            Cancel
          </Button>
          <Button
            form={formId}
            loading={pending}
            type="submit"
            variant={confirmTone === "danger" ? "danger" : "primary"}
          >
            {confirmLabel}
          </Button>
        </>
      }
      onOpenChange={(next) => {
        if (!next) cancel();
      }}
      open={open}
      size="compact"
      title={title}
    >
      <form className="grid gap-4" id={formId} noValidate onSubmit={submit}>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <Panel className="text-small">
          <p className="text-fg font-semibold">{action.title}</p>
          {action.description ? (
            <p className="text-fg-muted mt-0.5">{action.description}</p>
          ) : null}
        </Panel>
        {reason ? (
          <FormField
            descriptionId={
              errors.reason || reason.hint ? reasonMessageId : undefined
            }
            error={errors.reason}
            hint={reason.hint}
            inputId={reasonId}
            label={reason.label}
            required={reason.required}
          >
            <Input
              aria-describedby={
                errors.reason || reason.hint ? reasonMessageId : undefined
              }
              aria-invalid={errors.reason ? true : undefined}
              aria-required={reason.required || undefined}
              autoComplete="off"
              disabled={pending}
              id={reasonId}
              maxLength={reason.maxLength ?? DEFAULT_REASON_MAX_LENGTH}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              type="text"
              value={values.reason}
            />
          </FormField>
        ) : null}
        <div className="grid gap-1.5">
          <FormLabel htmlFor={`${codeId}-0`}>Authenticator code</FormLabel>
          <OtpInput
            aria-describedby={
              errors.code || validityHint ? codeMessageId : undefined
            }
            aria-invalid={errors.code ? true : undefined}
            disabled={pending}
            id={codeId}
            length={codeLength}
            normalize={normalizeStepUpCode}
            onChange={(code) => setValues((current) => ({ ...current, code }))}
            value={values.code}
          />
          {errors.code ? (
            <FieldError id={codeMessageId}>{errors.code}</FieldError>
          ) : validityHint ? (
            <FieldHint id={codeMessageId}>{validityHint}</FieldHint>
          ) : null}
        </div>
      </form>
    </Dialog>
  );
}
