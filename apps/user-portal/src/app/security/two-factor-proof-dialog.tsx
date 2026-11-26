"use client";

import {
  ConfirmationCodeField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import { Alert, Button, Dialog } from "@template/ui-core";
import { useId, useRef, useState } from "react";
import {
  proofSchema,
  type ProofAction,
  type ProofValues,
} from "./two-factor-flow";

const COPY: Readonly<
  Record<ProofAction, { confirm: string; description: string; title: string }>
> = {
  disable: {
    confirm: "Disable two-factor",
    description:
      "Confirm with a code from your authenticator app or a recovery code. Your account will then be protected only by your password and passkeys.",
    title: "Disable two-factor authentication?",
  },
  regenerate: {
    confirm: "Regenerate codes",
    description:
      "Confirm with a code from your authenticator app or a recovery code. Every recovery code you saved before stops working.",
    title: "Regenerate recovery codes?",
  },
};

/**
 * Proof for disabling two-factor or regenerating recovery codes: a six-digit
 * authenticator code or a ten-character recovery code, verified by the
 * backend. There is no confirm-only path. Mount with a fresh `key` per use.
 */
export function TwoFactorProofDialog({
  action,
  onClose,
  onSubmit,
  pending,
}: Readonly<{
  action: ProofAction | undefined;
  onClose: () => void;
  /** Resolves with an error message, or undefined once the backend accepted. */
  onSubmit: (
    action: ProofAction,
    values: ProofValues,
  ) => Promise<string | undefined>;
  pending: boolean;
}>) {
  const copy = COPY[action ?? "disable"];
  const formId = useId();

  return (
    <Dialog
      description={copy.description}
      dismissible={!pending}
      footer={
        <>
          <Button disabled={pending} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            form={formId}
            loading={pending}
            type="submit"
            variant={action === "disable" ? "danger" : "primary"}
          >
            {copy.confirm}
          </Button>
        </>
      }
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open={action !== undefined}
      size="compact"
      title={copy.title}
    >
      {action ? (
        <ProofForm
          action={action}
          formId={formId}
          onSubmit={onSubmit}
          pending={pending}
        />
      ) : null}
    </Dialog>
  );
}

/** The proof form (exported for static tests). */
export function ProofForm({
  action,
  formId,
  onSubmit,
  pending,
}: Readonly<{
  action: ProofAction;
  formId: string;
  onSubmit: (
    action: ProofAction,
    values: ProofValues,
  ) => Promise<string | undefined>;
  pending: boolean;
}>) {
  const [error, setError] = useState<string>();
  const submissionActive = useRef(false);
  const form = useValidatedForm<ProofValues>(proofSchema, {
    defaultValues: { code: "", verificationMethod: "authenticator" },
  });
  const method = form.watch("verificationMethod");

  async function submit(values: ProofValues) {
    if (submissionActive.current) return;
    submissionActive.current = true;
    setError(undefined);
    try {
      const problem = await onSubmit(action, values);
      if (problem) {
        setError(problem);
        form.setValue("code", "");
      }
    } finally {
      submissionActive.current = false;
    }
  }

  return (
    <ValidatedForm
      className="flex flex-col gap-4"
      form={form}
      id={formId}
      onSubmit={submit}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <input {...form.register("verificationMethod")} type="hidden" />
      <ConfirmationCodeField<ProofValues>
        autoFocus
        characterSet={method === "authenticator" ? "numeric" : "alphanumeric"}
        disabled={pending}
        groupAfter={method === "recovery_code" ? 5 : undefined}
        key={method}
        label={
          method === "authenticator" ? "Authenticator code" : "Recovery code"
        }
        length={method === "authenticator" ? 6 : 10}
        name="code"
        onComplete={() => void form.handleSubmit(submit)()}
        required
      />
      <Button
        className="self-start"
        disabled={pending}
        onClick={() => {
          form.setValue(
            "verificationMethod",
            method === "authenticator" ? "recovery_code" : "authenticator",
          );
          form.setValue("code", "");
          form.clearErrors();
          setError(undefined);
        }}
        size="sm"
        variant="ghost"
      >
        {method === "authenticator"
          ? "Use a recovery code"
          : "Use an authenticator code"}
      </Button>
    </ValidatedForm>
  );
}
