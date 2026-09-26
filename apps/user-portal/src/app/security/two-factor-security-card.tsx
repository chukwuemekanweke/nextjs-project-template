"use client";

import { isApiError } from "@template/api-client";
import {
  useDisableTwoFactor,
  useRegenerateRecoveryCodes,
  useSetupTwoFactor,
  useTwoFactorStatus,
  useVerifyTwoFactorEnrollment,
} from "@template/api-react/authentication";
import {
  ConfirmationCodeField,
  ValidatedForm,
  useValidatedForm,
} from "@template/forms";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Modal,
  Skeleton,
} from "@template/ui-core";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { z } from "zod";

const enrollmentSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
});

const proofSchema = z.discriminatedUnion("verificationMethod", [
  z.object({
    code: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
    verificationMethod: z.literal("authenticator"),
  }),
  z.object({
    code: z
      .string()
      .regex(/^[A-Z0-9]{10}$/, "Enter the complete recovery code."),
    verificationMethod: z.literal("recovery_code"),
  }),
]);

type EnrollmentValues = z.infer<typeof enrollmentSchema>;
type ProofValues = z.infer<typeof proofSchema>;
type SensitiveRecoveryResult = {
  codes: string[];
  source: "enrollment" | "regeneration";
};

export function TwoFactorSecurityCard() {
  const status = useTwoFactorStatus();
  const setup = useSetupTwoFactor();
  const verify = useVerifyTwoFactorEnrollment();
  const regenerate = useRegenerateRecoveryCodes();
  const disable = useDisableTwoFactor();
  const [action, setAction] = useState<"disable" | "regenerate">();
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [recoveryResult, setRecoveryResult] =
    useState<SensitiveRecoveryResult>();
  const [error, setError] = useState<string>();

  async function beginSetup() {
    setup.reset();
    verify.reset();
    setRecoveryResult(undefined);
    setError(undefined);
    setSetupModalOpen(true);
    try {
      await setup.mutateAsync();
    } catch (caughtError) {
      setError(managementError(caughtError));
    }
  }

  function clearSensitiveState() {
    setup.reset();
    verify.reset();
    regenerate.reset();
    setRecoveryResult(undefined);
    setError(undefined);
  }

  function closeSetupModal() {
    clearSensitiveState();
    setSetupModalOpen(false);
  }

  return (
    <Card>
      <CardContent>
        <CardTitle>Authenticator two-factor authentication</CardTitle>
        <CardDescription>
          Require a code from your authenticator app when starting a new
          session.
        </CardDescription>
        <div className="mt-5 space-y-5">
          {status.isPending ? (
            <TwoFactorStatusSkeleton />
          ) : status.isError ? (
            <Alert variant="error">{twoFactorStatusError(status.error)}</Alert>
          ) : status.data?.enabled ? (
            <EnabledPanel
              onDisable={() => setAction("disable")}
              onRegenerate={() => setAction("regenerate")}
              recoveryCodesRemaining={status.data.recoveryCodesRemaining}
            />
          ) : (
            <DisabledPanel
              onEnable={() => void beginSetup()}
              pending={setup.isPending}
            />
          )}
        </div>
        <SetupModal
          error={error}
          onClose={closeSetupModal}
          onRetry={() => void beginSetup()}
          onSaved={closeSetupModal}
          onVerified={(codes) => {
            setup.reset();
            verify.reset();
            setRecoveryResult({ codes, source: "enrollment" });
          }}
          open={setupModalOpen}
          recoveryResult={recoveryResult}
          setup={setup}
          verify={verify}
        />
        <ProofModal
          action={action}
          disable={disable}
          onClose={() => setAction(undefined)}
          onDisabled={() => {
            setAction(undefined);
            clearSensitiveState();
          }}
          onRegenerated={(codes) => {
            setAction(undefined);
            regenerate.reset();
            setRecoveryResult({ codes, source: "regeneration" });
            setSetupModalOpen(true);
          }}
          regenerate={regenerate}
        />
      </CardContent>
    </Card>
  );
}

function TwoFactorStatusSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading two-factor settings"
      className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
      role="status"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

function DisabledPanel({
  onEnable,
  pending,
}: Readonly<{ onEnable: () => void; pending: boolean }>) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <div>
        <p className="font-medium text-gray-800 dark:text-white/90">Disabled</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add an authenticator app for stronger account protection.
        </p>
      </div>
      <button
        className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        disabled={pending}
        onClick={onEnable}
        type="button"
      >
        Enable
      </button>
    </div>
  );
}

function SetupModal({
  error,
  onClose,
  onRetry,
  onSaved,
  onVerified,
  open,
  recoveryResult,
  setup,
  verify,
}: Readonly<{
  error: string | undefined;
  onClose: () => void;
  onRetry: () => void;
  onSaved: () => void;
  onVerified: (codes: string[]) => void;
  open: boolean;
  recoveryResult: SensitiveRecoveryResult | undefined;
  setup: ReturnType<typeof useSetupTwoFactor>;
  verify: ReturnType<typeof useVerifyTwoFactorEnrollment>;
}>) {
  const showingRecoveryCodes = Boolean(recoveryResult);

  return (
    <Modal
      description={
        showingRecoveryCodes
          ? "Store these somewhere safe before closing this window."
          : "Scan the QR code, then verify a code from your authenticator app."
      }
      onClose={onClose}
      open={open}
      title={
        showingRecoveryCodes
          ? "Save your recovery codes"
          : "Set up an authenticator app"
      }
    >
      {setup.isPending ? (
        <div aria-busy="true" className="space-y-5" role="status">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="mx-auto h-48 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert variant="error">{error}</Alert>
          <button
            className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : recoveryResult ? (
        <RecoveryCodesPanel
          codes={recoveryResult.codes}
          onSaved={onSaved}
          source={recoveryResult.source}
        />
      ) : setup.data ? (
        <EnrollmentPanel
          authenticatorUri={setup.data.authenticatorUri}
          onCancel={onClose}
          onVerified={onVerified}
          sharedKey={setup.data.sharedKey}
          verify={verify}
        />
      ) : null}
    </Modal>
  );
}

function EnabledPanel({
  onDisable,
  onRegenerate,
  recoveryCodesRemaining,
}: Readonly<{
  onDisable: () => void;
  onRegenerate: () => void;
  recoveryCodesRemaining: number;
}>) {
  return (
    <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div>
        <p className="font-medium text-gray-800 dark:text-white/90">
          Authenticator app · Enabled
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Recovery codes remaining: {recoveryCodesRemaining}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-400 rounded-lg border px-4 py-2.5 text-sm font-medium"
          onClick={onRegenerate}
          type="button"
        >
          Regenerate recovery codes
        </button>
        <button
          className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          onClick={onDisable}
          type="button"
        >
          Disable
        </button>
      </div>
    </div>
  );
}

function EnrollmentPanel({
  authenticatorUri,
  onCancel,
  onVerified,
  sharedKey,
  verify,
}: Readonly<{
  authenticatorUri: string;
  onCancel: () => void;
  onVerified: (codes: string[]) => void;
  sharedKey: string;
  verify: ReturnType<typeof useVerifyTwoFactorEnrollment>;
}>) {
  const [error, setError] = useState<string>();
  const form = useValidatedForm(enrollmentSchema, {
    defaultValues: { code: "" },
  });

  async function submit(values: EnrollmentValues) {
    setError(undefined);
    try {
      const result = await verify.mutateAsync(values);
      form.reset();
      onVerified(result.recoveryCodes);
    } catch (caughtError) {
      setError(
        managementError(caughtError, "The authenticator code is incorrect."),
      );
    }
  }

  function submitCompletedCode() {
    void form.handleSubmit(submit)();
  }

  return (
    <div className="space-y-5">
      <Alert variant="info">
        Scan this code in your authenticator app, or enter the manual key. The
        setup secret is shown only in this view.
      </Alert>
      <div className="flex justify-center rounded-xl bg-white p-4">
        <QRCodeSVG
          aria-label="Authenticator setup QR code"
          size={192}
          value={authenticatorUri}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Manual setup key
        </p>
        <code className="mt-2 block rounded-lg bg-gray-100 p-3 text-sm break-all text-gray-800 dark:bg-gray-800 dark:text-gray-100">
          {sharedKey}
        </code>
      </div>
      <ValidatedForm className="space-y-4" form={form} onSubmit={submit}>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <ConfirmationCodeField<EnrollmentValues>
          autoFocus
          disabled={verify.isPending}
          label="Authenticator code"
          length={6}
          name="code"
          onComplete={submitCompletedCode}
          required
        />
        <div className="flex flex-col items-center gap-3 text-center">
          {verify.isPending ? (
            <div
              aria-live="polite"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
              role="status"
            >
              <span
                aria-hidden="true"
                className="border-brand-500 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              />
              Verifying…
            </div>
          ) : null}
          <button
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
            disabled={verify.isPending}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </ValidatedForm>
    </div>
  );
}

function RecoveryCodesPanel({
  codes,
  onSaved,
  source,
}: Readonly<{
  codes: string[];
  onSaved: () => void;
  source: SensitiveRecoveryResult["source"];
}>) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-5">
      <Alert variant="warning">
        Save these recovery codes now. They will not be shown again, and each
        code can be used only once.
      </Alert>
      {source === "regeneration" ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your previous recovery codes are no longer valid.
        </p>
      ) : null}
      <div className="space-y-2">
        <div className="flex justify-end">
          <button
            aria-label="Download recovery codes as a text file"
            className="text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/30 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition dark:border-gray-700"
            onClick={() => downloadRecoveryCodes(codes)}
            title="Download recovery codes"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
        <ul className="grid grid-cols-1 gap-2 rounded-xl bg-gray-100 p-4 font-mono text-sm text-gray-800 sm:grid-cols-2 dark:bg-gray-800 dark:text-gray-100">
          {codes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-400 rounded-lg border px-4 py-2.5 text-sm font-medium"
          onClick={() => {
            void navigator.clipboard.writeText(codes.join("\n")).then(() => {
              setCopied(true);
            });
          }}
          type="button"
        >
          {copied ? "Copied" : "Copy all"}
        </button>
        <button
          className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          onClick={onSaved}
          type="button"
        >
          I have saved my recovery codes
        </button>
      </div>
    </div>
  );
}

function downloadRecoveryCodes(codes: string[]): void {
  const contents = [
    "Two-factor authentication recovery codes",
    "Each code can be used only once.",
    "",
    ...codes,
    "",
  ].join("\n");
  const file = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.download = "two-factor-recovery-codes.txt";
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ProofModal({
  action,
  disable,
  onClose,
  onDisabled,
  onRegenerated,
  regenerate,
}: Readonly<{
  action: "disable" | "regenerate" | undefined;
  disable: ReturnType<typeof useDisableTwoFactor>;
  onClose: () => void;
  onDisabled: () => void;
  onRegenerated: (codes: string[]) => void;
  regenerate: ReturnType<typeof useRegenerateRecoveryCodes>;
}>) {
  const [error, setError] = useState<string>();
  const form = useValidatedForm<ProofValues>(proofSchema, {
    defaultValues: { code: "", verificationMethod: "authenticator" },
  });
  const method = form.watch("verificationMethod");

  async function submit(values: ProofValues) {
    if (!action) return;
    setError(undefined);
    try {
      if (action === "regenerate") {
        const result = await regenerate.mutateAsync(values);
        form.reset();
        onRegenerated(result.recoveryCodes);
        return;
      }
      await disable.mutateAsync(values);
      form.reset();
      onDisabled();
    } catch (caughtError) {
      setError(
        managementError(caughtError, "The verification code is incorrect."),
      );
    }
  }

  function submitCompletedCode() {
    void form.handleSubmit(submit)();
  }

  return (
    <Modal
      description={
        action === "regenerate"
          ? "This invalidates every recovery code you saved previously."
          : "This removes authenticator protection from your account."
      }
      onClose={() => {
        form.reset();
        setError(undefined);
        onClose();
      }}
      open={Boolean(action)}
      size="compact"
      title={
        action === "regenerate"
          ? "Regenerate recovery codes?"
          : "Disable two-factor authentication?"
      }
    >
      <ValidatedForm className="space-y-4" form={form} onSubmit={submit}>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <input {...form.register("verificationMethod")} type="hidden" />
        <ConfirmationCodeField<ProofValues>
          characterSet={method === "authenticator" ? "numeric" : "alphanumeric"}
          disabled={disable.isPending || regenerate.isPending}
          groupAfter={method === "recovery_code" ? 5 : undefined}
          label={
            method === "authenticator" ? "Authenticator code" : "Recovery code"
          }
          length={method === "authenticator" ? 6 : 10}
          name="code"
          onComplete={submitCompletedCode}
          required
        />
        <div className="flex flex-col items-center gap-3 text-center">
          {disable.isPending || regenerate.isPending ? (
            <div
              aria-live="polite"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
              role="status"
            >
              <span
                aria-hidden="true"
                className="border-brand-500 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              />
              Verifying…
            </div>
          ) : null}
          <button
            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 text-sm font-medium disabled:opacity-60"
            disabled={disable.isPending || regenerate.isPending}
            onClick={() => {
              form.setValue(
                "verificationMethod",
                method === "authenticator" ? "recovery_code" : "authenticator",
              );
              form.setValue("code", "");
              form.clearErrors();
            }}
            type="button"
          >
            {method === "authenticator"
              ? "Use a recovery code"
              : "Use an authenticator code"}
          </button>
        </div>
      </ValidatedForm>
    </Modal>
  );
}

function managementError(error: unknown, unauthorizedMessage?: string): string {
  if (isApiError(error)) {
    if (error.status === 401 && unauthorizedMessage) return unauthorizedMessage;
    if (error.status === 423) return "This account is temporarily locked.";
    if (error.status === 429) return "Too many attempts. Try again later.";
    if (error.safeMessage) return error.safeMessage;
  }
  return "Two-factor settings could not be updated. Try again.";
}

function twoFactorStatusError(error: unknown): string {
  if (isApiError(error) && error.status === 403) {
    return "Your current session does not have permission to manage two-factor authentication. Sign out and sign in again. If the problem continues, contact support.";
  }
  return "Two-factor settings could not be loaded. Refresh and try again.";
}
