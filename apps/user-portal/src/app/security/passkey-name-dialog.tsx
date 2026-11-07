"use client";

import { Alert, Modal } from "@template/ui-core";
import { useId, useState, type FormEvent } from "react";
import {
  PASSKEY_NAME_MAX_LENGTH,
  validatePasskeyName,
} from "@/lib/passkey-management";

/**
 * Collects a passkey friendly name for registration or renaming. Mount it with
 * a fresh `key` to reset its local state for each use.
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
    <Modal
      description={description}
      onClose={pending ? undefined : onClose}
      open
      size="compact"
      title={title}
    >
      <form className="space-y-4" noValidate onSubmit={submit}>
        {error ? <Alert variant="error">{error}</Alert> : null}
        {notice ? (
          <p className="text-sm text-gray-600 dark:text-gray-400" role="status">
            {notice}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor={inputId}
          >
            Passkey name
          </label>
          <input
            aria-describedby={fieldError ? errorId : undefined}
            aria-invalid={fieldError ? true : undefined}
            autoComplete="off"
            autoFocus
            className="focus:border-brand-300 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:text-white/90"
            disabled={pending}
            id={inputId}
            maxLength={PASSKEY_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="For example, Work laptop"
            required
            value={name}
          />
          {fieldError ? (
            <p className="text-sm text-red-600 dark:text-red-400" id={errorId}>
              {fieldError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            aria-busy={pending || undefined}
            className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
