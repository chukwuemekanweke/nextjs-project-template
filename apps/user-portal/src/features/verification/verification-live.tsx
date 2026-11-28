"use client";

import {
  useCurrentKycVerification,
  useStartKycVerification,
} from "@template/api-react/kyc";
import { Alert, Button } from "@template/ui-core";
import { useState, type ReactNode } from "react";
import { toVerificationScreenModel } from "./verification-adapter";
import {
  createVerificationStarter,
  type VerificationStartOutcome,
} from "./verification-flow";
import type { VerificationIntent } from "./verification-model";
import { VerificationScreen } from "./verification-sections";

export function VerificationLive({
  navigate = (href) => window.location.assign(href),
}: Readonly<{ navigate?: (href: string) => void }>) {
  const verification = useCurrentKycVerification();
  const start = useStartKycVerification();
  const [manualRefresh, setManualRefresh] = useState(false);
  const [outcome, setOutcome] = useState<VerificationStartOutcome>();
  const [starter] = useState(() =>
    createVerificationStarter({ navigate, start: start.mutateAsync }),
  );

  const model = toVerificationScreenModel(
    verification.data,
    verification.isPending
      ? "loading"
      : verification.isError
        ? "error"
        : "ready",
  );

  async function refresh() {
    setManualRefresh(true);
    try {
      await verification.refetch();
    } finally {
      setManualRefresh(false);
    }
  }

  async function act(intent: VerificationIntent) {
    setOutcome(undefined);
    if (intent === "refresh") {
      await refresh();
      return;
    }
    const result = await starter.run();
    if (result.type !== "ignored" && result.type !== "redirect") {
      setOutcome(result);
    }
  }

  const notices: ReactNode = (
    <>
      {outcome?.type === "error" ? (
        <Alert onDismiss={() => setOutcome(undefined)} variant="error">
          {outcome.message}
        </Alert>
      ) : null}
      {outcome?.type === "preparing" ? (
        <Alert onDismiss={() => setOutcome(undefined)} variant="info">
          Your secure verification session is still being prepared. Refresh or
          try again shortly.
        </Alert>
      ) : null}
      {verification.pollingExhausted ? (
        <Alert title="Automatic status checks paused" variant="info">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Verification may still be processing. Refresh to check the latest
              authoritative status.
            </span>
            <Button
              loading={manualRefresh}
              onClick={() => void refresh()}
              size="sm"
              variant="secondary"
            >
              Refresh status
            </Button>
          </div>
        </Alert>
      ) : null}
    </>
  );

  return (
    <VerificationScreen
      busyIntent={
        start.isPending
          ? model.state === "ready"
            ? model.verification.status === "rejected" ||
              model.verification.status === "failed"
              ? "retry"
              : model.verification.status === "inProgress"
                ? "continue"
                : "start"
            : undefined
          : manualRefresh
            ? "refresh"
            : undefined
      }
      model={model}
      notices={notices}
      onAction={(intent) => void act(intent)}
      onReload={() => void refresh()}
    />
  );
}
