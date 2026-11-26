"use client";

import type { ActiveSessionResponse } from "@template/api-client/authentication";
import {
  useActiveSessions,
  useRevokeOtherSessions,
  useRevokeSession,
} from "@template/api-react/authentication";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ClockIcon,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LaptopIcon,
  ListRow,
  MapPinIcon,
  SkeletonList,
  WifiIcon,
} from "@template/ui-core";
import { useCallback, useRef, useState } from "react";
import { BrowserIcon } from "./browser-icon";
import {
  runSecurityAction,
  sessionActionError,
  sessionsLoadError,
} from "./security-actions";
import {
  browserIconKind,
  describeDevice,
  describeLocation,
  formatRelativeTime,
  ipAddressLookupUrl,
  sortSessionsCurrentFirst,
} from "./session-display";

type PendingConfirmation =
  { kind: "others" } | { kind: "session"; session: ActiveSessionResponse };

/**
 * Sessions tab (reference `UserSecurity-sessions`). The current session is
 * listed first, labelled, and never offered a sign-out here (Logout covers
 * it). Every sign-out is confirmed first and reported only after the backend
 * succeeds; the mutations invalidate the sessions query.
 */
export function ActiveSessionsCard() {
  const sessions = useActiveSessions();
  const revokeSession = useRevokeSession();
  const revokeOtherSessions = useRevokeOtherSessions();
  const [confirming, setConfirming] = useState<PendingConfirmation>();
  const [pendingSessionId, setPendingSessionId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();
  const actionActive = useRef(false);

  const orderedSessions = sessions.data
    ? sortSessionsCurrentFirst(sessions.data)
    : [];
  const otherSessionCount = orderedSessions.filter(
    (session) => !session.isCurrent,
  ).length;
  const revokePending =
    pendingSessionId !== undefined ||
    revokeSession.isPending ||
    revokeOtherSessions.isPending;
  const dismissError = useCallback(() => setActionError(undefined), []);
  const dismissConfirmation = useCallback(() => setConfirmation(undefined), []);

  async function confirm() {
    if (!confirming || actionActive.current) return;
    actionActive.current = true;
    setActionError(undefined);
    setConfirmation(undefined);
    const target = confirming;
    if (target.kind === "session")
      setPendingSessionId(target.session.sessionId);
    try {
      const outcome =
        target.kind === "session"
          ? await runSecurityAction(
              () =>
                revokeSession.mutateAsync({
                  sessionId: target.session.sessionId,
                }),
              "The session was signed out successfully.",
              sessionActionError,
            )
          : await runSecurityAction(
              () => revokeOtherSessions.mutateAsync(),
              "All other sessions were signed out successfully.",
              sessionActionError,
            );
      setConfirming(undefined);
      if (outcome.status === "succeeded") setConfirmation(outcome.message);
      else setActionError(outcome.message);
    } finally {
      setPendingSessionId(undefined);
      actionActive.current = false;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Active sessions</CardTitle>
          <p className="text-small text-fg-muted mt-0.5">
            Devices and browsers currently signed in to your account.
          </p>
        </div>
        {otherSessionCount > 0 ? (
          <Button
            disabled={revokePending}
            onClick={() => setConfirming({ kind: "others" })}
            size="sm"
            variant="secondary"
          >
            Sign out all other sessions
          </Button>
        ) : null}
      </CardHeader>
      {actionError || confirmation ? (
        <CardContent className="flex flex-col gap-3 pb-0 md:pb-0">
          {actionError ? (
            <Alert onDismiss={dismissError} variant="error">
              {actionError}
            </Alert>
          ) : null}
          {confirmation ? (
            <Alert
              autoDismissAfter={5_000}
              onDismiss={dismissConfirmation}
              variant="success"
            >
              {confirmation}
            </Alert>
          ) : null}
        </CardContent>
      ) : null}
      {sessions.isPending ? (
        <SkeletonList label="Loading active sessions" rows={2} />
      ) : sessions.isError ? (
        <ErrorState
          description={sessionsLoadError(sessions.error)}
          title="Active sessions unavailable"
        />
      ) : orderedSessions.length === 0 ? (
        <CardContent>
          <EmptyState
            description="No active sessions were found."
            icon={<LaptopIcon />}
            title="No sessions"
          />
        </CardContent>
      ) : (
        <ul aria-label="Active sessions">
          {orderedSessions.map((session) => (
            <SessionRow
              disabled={revokePending}
              key={session.sessionId}
              onRevoke={() => setConfirming({ kind: "session", session })}
              pending={pendingSessionId === session.sessionId}
              session={session}
            />
          ))}
        </ul>
      )}
      <ConfirmDialog
        confirmLabel={
          confirming?.kind === "session"
            ? "Sign out session"
            : "Sign out all other sessions"
        }
        description={
          confirming?.kind === "session"
            ? "That browser or device will be signed out immediately. This device stays signed in."
            : "Every other browser and device will be signed out immediately. This device stays signed in."
        }
        onCancel={() => setConfirming(undefined)}
        onConfirm={() => void confirm()}
        open={confirming !== undefined}
        pending={revokePending}
        title={
          confirming?.kind === "session"
            ? `Sign out ${describeDevice(confirming.session)}?`
            : "Sign out all other sessions?"
        }
      />
    </Card>
  );
}

export function SessionRow({
  disabled,
  onRevoke,
  pending,
  session,
}: Readonly<{
  disabled: boolean;
  onRevoke: () => void;
  pending: boolean;
  session: ActiveSessionResponse;
}>) {
  const location = describeLocation(session);
  const deviceLabel = describeDevice(session);

  return (
    <ListRow
      actions={
        session.isCurrent ? undefined : (
          <Button
            aria-label={`Sign out ${deviceLabel}`}
            disabled={disabled}
            loading={pending}
            onClick={onRevoke}
            size="sm"
            variant="dangerOutline"
          >
            Sign out
          </Button>
        )
      }
      as="li"
      className={session.isCurrent ? "bg-surface-2" : undefined}
      leading={<BrowserIcon kind={browserIconKind(session)} />}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {deviceLabel}
          {session.isCurrent ? <Badge tone="info">This device</Badge> : null}
        </span>
      }
    >
      <div className="text-small text-fg-muted mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <WifiIcon className="text-fg-subtle" size="xs" />
          <span className="sr-only">IP address: </span>
          <a
            className="hover:text-brand-ink decoration-border-strong break-all underline decoration-dotted underline-offset-2"
            href={ipAddressLookupUrl(session.lastIpAddress)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {session.lastIpAddress}
            <span className="sr-only">
              {" "}
              (opens IP address lookup in a new tab)
            </span>
          </a>
        </span>
        {location ? (
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="text-fg-subtle" size="xs" />
            <span className="sr-only">Location: </span>
            {location}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <ClockIcon className="text-fg-subtle" size="xs" />
          Last active {formatRelativeTime(session.lastActiveAtUtc)}
        </span>
      </div>
    </ListRow>
  );
}
