"use client";

import type { TwoFactorSetupResponse } from "@template/api-client/authentication";
import {
  ConfirmationCodeField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import {
  Alert,
  Button,
  CopyIcon,
  Dialog,
  Panel,
  Skeleton,
  LoadingStatus,
} from "@template/ui-core";
import { QRCodeSVG } from "qrcode.react";
import { useId, useRef, useState } from "react";
import { RecoveryCodesPanel } from "./recovery-codes-panel";
import {
  canFinishSetup,
  enrollmentSchema,
  groupSetupKey,
  isSetupDismissible,
  setupStepLabel,
  type EnrollmentValues,
  type SetupDialogState,
} from "./two-factor-flow";

export type SetupDialogProps = Readonly<{
  onBack: () => void;
  onDismiss: () => void;
  onFinish: () => void;
  onSavedChange: (saved: boolean) => void;
  onStart: () => void;
  onVerify: (values: EnrollmentValues) => Promise<string | undefined>;
  setup: Readonly<{
    data?: TwoFactorSetupResponse;
    error?: string;
    pending: boolean;
  }>;
  state: SetupDialogState;
  verifying: boolean;
}>;

/**
 * Three-step authenticator setup inside `/security` (reference
 * `UserTwoFactorSetup`): 1 explain, 2 scan and verify a code, 3 save the
 * one-time recovery codes. Regenerated codes reuse step 3 on its own.
 */
export function TwoFactorSetupDialog(props: SetupDialogProps) {
  const { state } = props;
  const formId = useId();
  const dismissible = isSetupDismissible(state) && !props.verifying;

  return (
    <Dialog
      description={setupStepLabel(state)}
      dismissible={dismissible}
      footer={<SetupFooter {...props} formId={formId} />}
      onOpenChange={(open) => {
        if (!open) props.onDismiss();
      }}
      open={state.step !== "closed"}
      title={
        state.step === "codes"
          ? "Save your recovery codes"
          : "Set up two-factor authentication"
      }
    >
      <SetupDialogBody {...props} formId={formId} />
    </Dialog>
  );
}

/** Dialog body for the current step (exported for static tests). */
export function SetupDialogBody({
  formId,
  onSavedChange,
  onVerify,
  setup,
  state,
  verifying,
}: SetupDialogProps & Readonly<{ formId: string }>) {
  if (state.step === "intro") {
    return (
      <div className="text-fg-muted flex flex-col gap-3">
        <p>
          Two-factor authentication asks for a code from an authenticator app
          whenever you start a new session.
        </p>
        <p>
          Install an authenticator app such as Google Authenticator, Microsoft
          Authenticator, 1Password or Authy, then continue to link it to your
          account.
        </p>
      </div>
    );
  }

  if (state.step === "codes") {
    return (
      <RecoveryCodesPanel
        codes={state.codes}
        onSavedChange={onSavedChange}
        saved={state.saved}
        source={state.source}
      />
    );
  }

  if (state.step !== "scan") return null;

  if (setup.pending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <LoadingStatus label="Preparing your authenticator setup" />
        <div aria-hidden="true" className="flex flex-wrap gap-6">
          <Skeleton className="size-[168px]" />
          <div className="flex flex-1 flex-col gap-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    );
  }

  if (setup.error) {
    return <Alert variant="error">{setup.error}</Alert>;
  }

  if (!setup.data) return null;

  return (
    <EnrollmentStep
      authenticatorUri={setup.data.authenticatorUri}
      formId={formId}
      onVerify={onVerify}
      sharedKey={setup.data.sharedKey}
      verifying={verifying}
    />
  );
}

function SetupFooter({
  formId,
  onBack,
  onDismiss,
  onFinish,
  onStart,
  setup,
  state,
  verifying,
}: SetupDialogProps & Readonly<{ formId: string }>) {
  if (state.step === "intro") {
    return (
      <>
        <Button onClick={onDismiss} variant="secondary">
          Cancel
        </Button>
        <Button onClick={onStart}>Continue</Button>
      </>
    );
  }
  if (state.step === "scan") {
    return (
      <>
        <Button disabled={verifying} onClick={onBack} variant="ghost">
          Back
        </Button>
        {setup.error ? (
          <Button onClick={onStart}>Try again</Button>
        ) : (
          <Button
            disabled={!setup.data}
            form={formId}
            loading={verifying}
            type="submit"
          >
            Verify and continue
          </Button>
        )}
      </>
    );
  }
  if (state.step === "codes") {
    return (
      <Button disabled={!canFinishSetup(state)} onClick={onFinish}>
        Finish
      </Button>
    );
  }
  return null;
}

function EnrollmentStep({
  authenticatorUri,
  formId,
  onVerify,
  sharedKey,
  verifying,
}: Readonly<{
  authenticatorUri: string;
  formId: string;
  onVerify: (values: EnrollmentValues) => Promise<string | undefined>;
  sharedKey: string;
  verifying: boolean;
}>) {
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const submissionActive = useRef(false);
  const form = useValidatedForm(enrollmentSchema, {
    defaultValues: { code: "" },
  });

  async function submit(values: EnrollmentValues) {
    if (submissionActive.current) return;
    submissionActive.current = true;
    setError(undefined);
    try {
      const problem = await onVerify(values);
      if (problem) setError(problem);
      form.reset();
    } finally {
      submissionActive.current = false;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start gap-6">
        {/* QR codes need a light quiet zone to scan, in both themes. */}
        <div className="shrink-0 rounded-lg bg-white p-2">
          <QRCodeSVG
            aria-label="Authenticator setup QR code"
            role="img"
            size={152}
            value={authenticatorUri}
          />
        </div>
        <div className="flex min-w-[200px] flex-1 flex-col gap-2.5">
          <p className="text-small text-fg-muted">
            Scan the QR code with your authenticator app. Can&apos;t scan? Enter
            this setup key instead. It is shown only in this dialog.
          </p>
          <Panel
            aria-label="Manual setup key"
            className="text-fg px-3 py-2.5 font-mono text-[0.8125rem] break-all"
            role="group"
          >
            {groupSetupKey(sharedKey)}
          </Panel>
          <div>
            <Button
              leadingIcon={<CopyIcon />}
              onClick={() => {
                void navigator.clipboard
                  .writeText(sharedKey)
                  .then(() => setCopied(true));
              }}
              size="sm"
              variant="secondary"
            >
              {copied ? "Copied" : "Copy key"}
            </Button>
            <span aria-live="polite" className="sr-only">
              {copied ? "Setup key copied to the clipboard" : ""}
            </span>
          </div>
        </div>
      </div>
      <ValidatedForm
        className="flex flex-col gap-3"
        form={form}
        id={formId}
        onSubmit={submit}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <ConfirmationCodeField<EnrollmentValues>
          disabled={verifying}
          label="Enter the 6-digit code from the app"
          length={6}
          name="code"
          onComplete={() => void form.handleSubmit(submit)()}
          required
        />
      </ValidatedForm>
    </div>
  );
}
