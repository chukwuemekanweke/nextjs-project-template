"use client";

import type { TwoFactorStatusResponse } from "@template/api-client/authentication";
import {
  useDisableTwoFactor,
  useRegenerateRecoveryCodes,
  useSetupTwoFactor,
  useTwoFactorStatus,
  useVerifyTwoFactorEnrollment,
} from "@template/api-react/authentication";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  ErrorState,
  IconTile,
  KeyIcon,
  ListRow,
  ShieldIcon,
  SkeletonList,
  SmartphoneIcon,
} from "@template/ui-core";
import { useCallback, useReducer, useState } from "react";
import {
  CLOSED_SETUP_DIALOG,
  canFinishSetup,
  isSetupDismissible,
  setupDialogReducer,
  submitTwoFactorProof,
  twoFactorManagementError,
  twoFactorStatusError,
  verifyEnrollment,
  type EnrollmentValues,
  type ProofAction,
  type ProofValues,
} from "./two-factor-flow";
import { TwoFactorProofDialog } from "./two-factor-proof-dialog";
import { TwoFactorSetupDialog } from "./two-factor-setup-dialog";

/**
 * Two-factor tab (reference `UserSecurity-twofa` + `UserTwoFactorSetup`).
 * Status, setup, verification, regeneration and disable use the existing
 * hooks; MFA is shown as on or off only after the backend confirms. The
 * setup secret and recovery codes stay in component state and are cleared
 * when the dialog finishes or is dismissed. The contract has no enrollment
 * date or total code count, so neither is shown.
 */
export function TwoFactorSecurityCard() {
  const status = useTwoFactorStatus();
  const setup = useSetupTwoFactor();
  const verify = useVerifyTwoFactorEnrollment();
  const regenerate = useRegenerateRecoveryCodes();
  const disable = useDisableTwoFactor();
  const [dialog, dispatch] = useReducer(
    setupDialogReducer,
    CLOSED_SETUP_DIALOG,
  );
  const [setupError, setSetupError] = useState<string>();
  const [proofAction, setProofAction] = useState<ProofAction>();
  const [proofKey, setProofKey] = useState(0);
  const [notice, setNotice] = useState<string>();
  const dismissNotice = useCallback(() => setNotice(undefined), []);

  function clearSensitiveState() {
    setup.reset();
    verify.reset();
    regenerate.reset();
    setSetupError(undefined);
  }

  function openSetup() {
    clearSensitiveState();
    setNotice(undefined);
    dispatch({ type: "open" });
  }

  async function startSetup() {
    if (setup.isPending) return;
    setup.reset();
    setSetupError(undefined);
    dispatch({ type: "start" });
    try {
      await setup.mutateAsync();
    } catch (error) {
      setSetupError(twoFactorManagementError(error));
    }
  }

  function backToIntro() {
    clearSensitiveState();
    dispatch({ type: "back" });
  }

  async function verifyCode(values: EnrollmentValues) {
    const outcome = await verifyEnrollment(values, verify.mutateAsync);
    if (outcome.status === "failed") return outcome.message;
    // Drop the setup secret as soon as enrollment is verified.
    setup.reset();
    verify.reset();
    dispatch({ codes: outcome.codes, source: "enrollment", type: "codes" });
    return undefined;
  }

  function finishSetup() {
    if (!canFinishSetup(dialog)) return;
    clearSensitiveState();
    setNotice(
      dialog.step === "codes" && dialog.source === "regeneration"
        ? "Your new recovery codes are ready to use."
        : "Two-factor authentication is on.",
    );
    dispatch({ type: "finish" });
  }

  function dismissSetup() {
    if (!isSetupDismissible(dialog) || verify.isPending) return;
    clearSensitiveState();
    dispatch({ type: "dismiss" });
  }

  function openProof(action: ProofAction) {
    setNotice(undefined);
    setProofKey((key) => key + 1);
    setProofAction(action);
  }

  async function submitProof(action: ProofAction, values: ProofValues) {
    const outcome = await submitTwoFactorProof(action, values, {
      disable: disable.mutateAsync,
      regenerate: regenerate.mutateAsync,
    });
    if (outcome.status === "failed") return outcome.message;
    setProofAction(undefined);
    if (outcome.status === "disabled") {
      clearSensitiveState();
      disable.reset();
      setNotice("Two-factor authentication was turned off.");
    } else {
      regenerate.reset();
      dispatch({ codes: outcome.codes, source: "regeneration", type: "codes" });
    }
    return undefined;
  }

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Two-factor authentication</CardTitle>
          <p className="text-small text-fg-muted mt-0.5">
            Require a code from your authenticator app when starting a new
            session.
          </p>
        </div>
      </CardHeader>
      {notice ? (
        <div className="px-4 pt-4 md:px-6">
          <Alert
            autoDismissAfter={5_000}
            onDismiss={dismissNotice}
            variant="success"
          >
            {notice}
          </Alert>
        </div>
      ) : null}
      {status.isPending ? (
        <SkeletonList label="Loading two-factor settings" rows={2} />
      ) : status.isError ? (
        <ErrorState
          description={twoFactorStatusError(status.error)}
          title="Two-factor settings unavailable"
        />
      ) : (
        <TwoFactorStatusRows
          onDisable={() => openProof("disable")}
          onEnable={openSetup}
          onRegenerate={() => openProof("regenerate")}
          status={status.data}
        />
      )}
      <TwoFactorSetupDialog
        onBack={backToIntro}
        onDismiss={dismissSetup}
        onFinish={finishSetup}
        onSavedChange={(saved) => dispatch({ saved, type: "confirm-saved" })}
        onStart={() => void startSetup()}
        onVerify={verifyCode}
        setup={{
          data: setup.data,
          error: setupError,
          pending: setup.isPending,
        }}
        state={dialog}
        verifying={verify.isPending}
      />
      <TwoFactorProofDialog
        action={proofAction}
        key={proofKey}
        onClose={() => {
          if (disable.isPending || regenerate.isPending) return;
          setProofAction(undefined);
        }}
        onSubmit={submitProof}
        pending={disable.isPending || regenerate.isPending}
      />
    </Card>
  );
}

/** Enabled or disabled rows from the backend status (exported for tests). */
export function TwoFactorStatusRows({
  onDisable,
  onEnable,
  onRegenerate,
  status,
}: Readonly<{
  onDisable: () => void;
  onEnable: () => void;
  onRegenerate: () => void;
  status: TwoFactorStatusResponse;
}>) {
  if (!status.enabled) {
    return (
      <ul aria-label="Two-factor authentication">
        <ListRow
          actions={<Button onClick={onEnable}>Enable</Button>}
          as="li"
          description="Add an authenticator app for stronger account protection. You will be asked for a code when you start a new session."
          leading={
            <IconTile tone="neutral">
              <SmartphoneIcon />
            </IconTile>
          }
          title={
            <span className="flex flex-wrap items-center gap-2">
              Authenticator app
              <Badge tone="neutral">
                <span className="sr-only">Two-factor authentication is </span>
                Disabled
              </Badge>
            </span>
          }
        />
      </ul>
    );
  }

  const remaining = status.recoveryCodesRemaining;

  return (
    <ul aria-label="Two-factor authentication">
      <ListRow
        as="li"
        description="You will be asked for a code from your authenticator app when you start a new session."
        leading={
          <IconTile tone="success">
            <SmartphoneIcon />
          </IconTile>
        }
        title={
          <span className="flex flex-wrap items-center gap-2">
            Authenticator app
            <Badge tone="success">
              <span className="sr-only">Two-factor authentication is </span>
              Enabled
            </Badge>
          </span>
        }
      />
      <ListRow
        actions={
          <Button onClick={onRegenerate} size="sm" variant="secondary">
            Regenerate codes
          </Button>
        }
        as="li"
        description={
          remaining === 0 ? (
            <span className="text-warning">
              No recovery codes left. Regenerate codes so you can still sign in
              if you lose your authenticator.
            </span>
          ) : (
            `${remaining} unused recovery ${remaining === 1 ? "code" : "codes"}. Each code works once.`
          )
        }
        leading={
          <IconTile tone="neutral">
            <KeyIcon />
          </IconTile>
        }
        title="Recovery codes"
      />
      <ListRow
        actions={
          <Button onClick={onDisable} size="sm" variant="dangerOutline">
            Disable
          </Button>
        }
        as="li"
        description="Your account will then be protected only by your password and passkeys."
        leading={
          <IconTile tone="neutral">
            <ShieldIcon />
          </IconTile>
        }
        title="Turn off two-factor"
      />
    </ul>
  );
}
