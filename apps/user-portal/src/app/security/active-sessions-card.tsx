"use client";

import { isApiError } from "@template/api-client";
import type { ActiveSessionResponse } from "@template/api-client/authentication";
import {
  useActiveSessions,
  useRevokeOtherSessions,
  useRevokeSession,
} from "@template/api-react/authentication";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Modal,
  Skeleton,
} from "@template/ui-core";
import { useCallback, useRef, useState } from "react";
import {
  describeDevice,
  describeLocation,
  formatRelativeTime,
  ipAddressLookupUrl,
  sortSessionsCurrentFirst,
} from "./session-display";

export function ActiveSessionsCard() {
  const sessions = useActiveSessions();
  const revokeSession = useRevokeSession();
  const revokeOtherSessions = useRevokeOtherSessions();
  const [pendingSessionId, setPendingSessionId] = useState<string>();
  const [confirmingRevokeAll, setConfirmingRevokeAll] = useState(false);
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

  async function revoke(sessionId: string) {
    if (actionActive.current) return;
    actionActive.current = true;
    setActionError(undefined);
    setConfirmation(undefined);
    setPendingSessionId(sessionId);
    try {
      await revokeSession.mutateAsync({ sessionId });
      setConfirmation("The session was signed out successfully.");
    } catch (error) {
      setActionError(sessionActionError(error));
    } finally {
      setPendingSessionId(undefined);
      actionActive.current = false;
    }
  }

  async function revokeAllOthers() {
    if (actionActive.current) return;
    actionActive.current = true;
    setActionError(undefined);
    setConfirmation(undefined);
    try {
      await revokeOtherSessions.mutateAsync();
      setConfirmingRevokeAll(false);
      setConfirmation("All other sessions were signed out successfully.");
    } catch (error) {
      setActionError(sessionActionError(error));
    } finally {
      actionActive.current = false;
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              Devices and browsers currently signed in to your account.
            </CardDescription>
          </div>
          {otherSessionCount > 0 ? (
            <button
              className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
              disabled={revokePending}
              onClick={() => setConfirmingRevokeAll(true)}
              type="button"
            >
              Sign out all other sessions
            </button>
          ) : null}
        </div>
        <div className="mt-5 space-y-3">
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
          {sessions.isPending ? (
            <SessionListSkeleton />
          ) : sessions.isError ? (
            <Alert variant="error">{sessionsError(sessions.error)}</Alert>
          ) : orderedSessions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No active sessions were found.
            </p>
          ) : (
            <ul className="space-y-3">
              {orderedSessions.map((session) => (
                <SessionRow
                  key={session.sessionId}
                  disabled={revokePending}
                  onRevoke={() => void revoke(session.sessionId)}
                  pending={pendingSessionId === session.sessionId}
                  session={session}
                />
              ))}
            </ul>
          )}
        </div>
        <Modal
          description="Every other browser and device will be signed out immediately. This device stays signed in."
          onClose={() => setConfirmingRevokeAll(false)}
          open={confirmingRevokeAll}
          size="compact"
          title="Sign out all other sessions?"
        >
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
              disabled={revokePending}
              onClick={() => setConfirmingRevokeAll(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              disabled={revokePending}
              onClick={() => void revokeAllOthers()}
              type="button"
            >
              {revokeOtherSessions.isPending
                ? "Signing out…"
                : "Sign out all other sessions"}
            </button>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
}

function SessionRow({
  session,
  onRevoke,
  pending,
  disabled,
}: Readonly<{
  session: ActiveSessionResponse;
  onRevoke: () => void;
  pending: boolean;
  disabled: boolean;
}>) {
  const location = describeLocation(session);
  const deviceLabel = describeDevice(session);

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        session.isCurrent
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-gray-800 dark:text-white/90">
            {deviceLabel}
          </p>
          {session.isCurrent ? (
            <span className="inline-flex items-center rounded-full border border-emerald-300 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
              This device
            </span>
          ) : null}
        </div>
        <p className="text-sm break-words text-gray-500 dark:text-gray-400">
          <a
            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium underline decoration-dotted underline-offset-2"
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
          {location ? ` · ${location}` : null}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last active {formatRelativeTime(session.lastActiveAtUtc)}
        </p>
      </div>
      {!session.isCurrent ? (
        <button
          aria-label={`Sign out ${deviceLabel}`}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
          disabled={disabled}
          onClick={onRevoke}
          type="button"
        >
          {pending ? "Signing out…" : "Sign out"}
        </button>
      ) : null}
    </li>
  );
}

function SessionListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading active sessions"
      className="space-y-3"
      role="status"
    >
      {[0, 1].map((index) => (
        <div
          className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
          key={index}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  );
}

function sessionActionError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 404) {
      return "That session was already signed out.";
    }
    if (error.status === 403) {
      return "Your current session does not have permission to manage sessions. Sign out and sign in again.";
    }
    if (error.safeMessage) {
      return error.safeMessage;
    }
  }
  return "The session could not be signed out. Try again.";
}

function sessionsError(error: unknown): string {
  if (isApiError(error) && error.status === 403) {
    return "Your current session does not have permission to view active sessions. Sign out and sign in again.";
  }
  return "Active sessions could not be loaded. Refresh and try again.";
}
