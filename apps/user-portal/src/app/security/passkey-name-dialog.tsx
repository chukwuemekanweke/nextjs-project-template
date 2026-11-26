"use client";

import { Alert, Button, Dialog, FormField, Input } from "@template/ui-core";
import { useId, useState, type FormEvent } from "react";
import {
  PASSKEY_NAME_MAX_LENGTH,
  validatePasskeyName,
} from "@/lib/passkey-management";

/**
 * Collects a passkey friendly name for registration or renaming. Mount it with
 * a fresh `key` to reset its local state for each use. While `pending` the
 * dialog cannot be dismissed and both actions are inert.
 */
export function PasskeyNameDialog({
  description,
  error,
  initialName = "",
  notice,
  onClose,
  onSubmit,
  pending,
  pendingLabel,
  submitLabel,
  title,
}: Readonly<{
  description: string;
  error?: string;
  initialName?: string;
  notice?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
  pending: boolean;
  pendingLabel: string;
  submitLabel: string;
  title: string;
}>) {
  const formId = useId();
  const inputId = useId();
  const errorId = useId();
  const [name, setName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string>();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const problem = validatePasskeyName(name);
    setFieldError(problem);
    if (!problem) {
      onSubmit(name.trim());
    }
  }

  return (
    <Dialog
      description={description}
      dismissible={!pending}
      footer={
        <>
          <Button disabled={pending} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button form={formId} loading={pending} type="submit">
            {pending ? pendingLabel : submitLabel}
          </Button>
        </>
      }
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      size="compact"
      title={title}
    >
      <form
        className="flex flex-col gap-4"
        id={formId}
        noValidate
        onSubmit={submit}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        {notice ? <Alert variant="info">{notice}</Alert> : null}
        <FormField
          descriptionId={errorId}
          error={fieldError}
          inputId={inputId}
          label="Passkey name"
          required
        >
          <Input
            aria-describedby={fieldError ? errorId : undefined}
            aria-invalid={fieldError ? true : undefined}
            autoComplete="off"
            autoFocus
            disabled={pending}
            id={inputId}
            maxLength={PASSKEY_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="For example, Work laptop"
            required
            value={name}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
