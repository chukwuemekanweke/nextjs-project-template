"use client";

import { Alert, ConfirmDialog } from "@template/ui-core";
import {
  AdminStepUpDialog,
  type StepUpSubmission,
} from "@/components/admin-patterns";
import {
  userActionConfirmation,
  type AdminUserDetail,
  type AdminUserIntent,
} from "./users-model";

/**
 * Confirmation for a captured privileged intent: `AdminStepUpDialog`
 * (authenticator code; the dialog clears the code on close and after a
 * failure) or `ConfirmDialog`. Stateless: the detail screen owns the
 * captured intent, pending state and failure message.
 */
export function UserActionConfirmation({
  error,
  intent,
  onCancel,
  onSubmit,
  open,
  pending,
  user,
}: Readonly<{
  /** Safe failure message from `describeAdminActionFailure`. */
  error: string | null;
  intent: AdminUserIntent;
  onCancel: () => void;
  onSubmit: (stepUp?: StepUpSubmission) => void;
  open: boolean;
  pending: boolean;
  user: Pick<AdminUserDetail, "displayName">;
}>) {
  const copy = userActionConfirmation(intent, user);

  if (copy.kind === "stepUp") {
    return (
      <AdminStepUpDialog
        action={{ description: copy.description, title: copy.title }}
        confirmLabel={copy.confirmLabel}
        confirmTone={copy.tone}
        description={copy.stepUpDescription ?? ""}
        error={error}
        onCancel={onCancel}
        onSubmit={onSubmit}
        open={open}
        pending={pending}
      />
    );
  }

  return (
    <ConfirmDialog
      confirmLabel={copy.confirmLabel}
      description={copy.description}
      onCancel={onCancel}
      onConfirm={() => onSubmit()}
      open={open}
      pending={pending}
      title={copy.title}
      tone={copy.tone}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
    </ConfirmDialog>
  );
}
