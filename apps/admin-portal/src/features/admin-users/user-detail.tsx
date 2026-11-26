"use client";

import Link from "next/link";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  LockIcon,
  LogOutIcon,
} from "@template/ui-core";
import { useId, useRef, useState } from "react";
import {
  AdminDetailFallback,
  AdminDetailHeader,
  AdminUnavailableHint,
  describeAdminActionFailure,
  type StepUpSubmission,
} from "@/components/admin-patterns";
import { UserActionConfirmation } from "./user-action-confirmation";
import { UserSecurityActivityCard, UserSessionsCard } from "./user-sessions";
import {
  UserAccountCard,
  UserKycCard,
  UserRolesCard,
  UserSubscriptionCard,
} from "./user-summary-cards";
import {
  USER_ACTION_INVALIDATED,
  accountActionFor,
  accountStatusBadge,
  isUserIntentStillAllowed,
  rolesAvailableToAssign,
  type AdminRoleRef,
  type AdminUserActionHandler,
  type AdminUserDetail,
  type AdminUserDetailModel,
  type AdminUserDetailRecord,
  type AdminUserIntent,
  type AdminUserSession,
} from "./users-model";

/*
 * User detail (reference `AdminUserDetail*`; Trello FE-UI-013).
 * Presentation only: no route, navigation item or admin user API exists
 * yet (DR-071, DR-072, DR-121).
 *
 * Privileged actions follow one lifecycle:
 * 1. Opening a confirmation captures the intent with its explicit target
 *    (user id, and the role or session id).
 * 2. While it is open, the intent is re-checked against the record on
 *    screen; if the user, account status, role or session no longer
 *    matches, the confirmation closes with a notice instead of applying to
 *    another record.
 * 3. Submitting re-checks once more, then sends the captured intent. Only
 *    one request runs at a time.
 * 4. Success closes the dialog; the page re-reads the user (the screen never
 *    shows success or updates the record itself). Failure keeps the dialog
 *    open with safe copy from `describeAdminActionFailure` so the
 *    administrator can retry; step-up codes are cleared by the dialog.
 */

type OpenConfirmation = Readonly<{
  intent: AdminUserIntent;
  /** Safe message from the last failed attempt. */
  error: string | null;
}>;

/** The role selection belongs to the user it was made for. */
type RoleSelection = Readonly<{ userId: string; roleId: string }>;

function UserHeaderBadges({ user }: Readonly<{ user: AdminUserDetail }>) {
  const statusBadge = accountStatusBadge(user.accountStatus);
  return (
    <>
      <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
      {user.emailConfirmed === true ? (
        <Badge tone="success">Email confirmed</Badge>
      ) : null}
      {user.emailConfirmed === false ? (
        <Badge tone="warning">Email not confirmed</Badge>
      ) : null}
    </>
  );
}

function UserHeaderMeta({ user }: Readonly<{ user: AdminUserDetail }>) {
  return (
    <>
      <span className="break-all">{user.email}</span>
      {" · ID "}
      <span className="font-mono break-all">{user.id}</span>
      {user.tenantName ? ` · Tenant: ${user.tenantName}` : null}
    </>
  );
}

function assignableRolesFor(
  record: AdminUserDetailRecord | null,
): readonly AdminRoleRef[] {
  if (!record || record.assignableRoles.state !== "ready") {
    return [];
  }
  return rolesAvailableToAssign(record.assignableRoles.data, record.user.roles);
}

/**
 * User detail page body. Lock/unlock, sign out everywhere and role changes
 * open `AdminStepUpDialog`; revoking one session opens `ConfirmDialog`.
 * Without `onAction` every action is disabled with an explanation.
 */
export function AdminUserDetailScreen({
  getKycHref,
  listHref,
  model,
  onAction,
  onReload,
  rolesHref,
}: Readonly<{
  /** Link to an implemented KYC detail route. */
  getKycHref?: (verificationId: string) => string;
  /** Implemented users list route, for the back link. */
  listHref?: string;
  model: AdminUserDetailModel;
  onAction?: AdminUserActionHandler;
  onReload?: () => void;
  /** Implemented roles route ("Manage roles"). */
  rolesHref?: string;
}>) {
  const hintId = useId();
  const [confirmation, setConfirmation] = useState<OpenConfirmation | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [roleSelection, setRoleSelection] = useState<RoleSelection | null>(
    null,
  );
  // Re-entrancy guard: state updates are asynchronous, so a double click
  // could otherwise send a second request before `pending` renders.
  const submitting = useRef(false);

  const record = model.state === "ready" ? model.record : null;
  const assignable = assignableRolesFor(record);

  // Close a confirmation whose target no longer matches the record on
  // screen (another user, a changed status, a removed role or session).
  // Adjusting state during render avoids showing the stale dialog at all.
  if (
    confirmation &&
    !pending &&
    !(record && isUserIntentStillAllowed(confirmation.intent, record))
  ) {
    setConfirmation(null);
    setNotice(USER_ACTION_INVALIDATED);
  }

  // Drop a role selection made for another user or no longer offered.
  if (
    roleSelection &&
    (roleSelection.userId !== record?.user.id ||
      !assignable.some((role) => role.id === roleSelection.roleId))
  ) {
    setRoleSelection(null);
  }

  const back = listHref ? { href: listHref, label: "All users" } : undefined;
  if (!record) {
    return (
      <AdminDetailFallback
        backLink={
          back ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={back.href}>{back.label}</Link>
            </Button>
          ) : undefined
        }
        onRetry={onReload}
        resourceLabel="User"
        state={model}
      />
    );
  }

  const { user } = record;
  const accountAction = accountActionFor(user.accountStatus);
  const unavailable = !onAction;
  const describedBy = unavailable ? hintId : undefined;

  function openConfirmation(intent: AdminUserIntent) {
    if (!onAction || pending) {
      return;
    }
    setNotice(null);
    setConfirmation({ error: null, intent });
  }

  function requestAccountAction() {
    if (accountAction) {
      openConfirmation({ type: accountAction, userId: user.id });
    }
  }

  function requestSignOutAll() {
    openConfirmation({ type: "signOutAll", userId: user.id });
  }

  function requestRevokeSession(session: AdminUserSession) {
    openConfirmation({
      sessionId: session.id,
      sessionLabel: session.label,
      type: "revokeSession",
      userId: user.id,
    });
  }

  function requestAssignRole(role: AdminRoleRef) {
    openConfirmation({
      roleId: role.id,
      roleName: role.name,
      type: "assignRole",
      userId: user.id,
    });
  }

  function requestRemoveRole(role: AdminRoleRef) {
    openConfirmation({
      roleId: role.id,
      roleName: role.name,
      type: "removeRole",
      userId: user.id,
    });
  }

  function selectRole(roleId: string) {
    setRoleSelection(roleId ? { roleId, userId: user.id } : null);
  }

  function cancelConfirmation() {
    if (pending) {
      return;
    }
    setConfirmation(null);
  }

  async function submitConfirmation(stepUp?: StepUpSubmission) {
    if (!onAction || !confirmation || submitting.current) {
      return;
    }
    const { intent } = confirmation;
    if (!record || !isUserIntentStillAllowed(intent, record)) {
      setConfirmation(null);
      setNotice(USER_ACTION_INVALIDATED);
      return;
    }

    submitting.current = true;
    setPending(true);
    setConfirmation({ error: null, intent });
    try {
      await onAction(stepUp ? { intent, stepUp } : { intent });
      setConfirmation(null);
      if (intent.type === "assignRole") {
        setRoleSelection(null);
      }
    } catch (error) {
      setConfirmation({
        error: describeAdminActionFailure(error).message,
        intent,
      });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <AdminDetailHeader
        actions={
          <>
            <Button
              aria-describedby={describedBy}
              disabled={unavailable}
              leadingIcon={<LogOutIcon />}
              onClick={requestSignOutAll}
              variant="secondary"
            >
              Sign out all sessions
            </Button>
            {accountAction ? (
              <Button
                aria-describedby={describedBy}
                data-intent={accountAction}
                disabled={unavailable}
                leadingIcon={
                  accountAction === "lock" ? <LockIcon /> : undefined
                }
                onClick={requestAccountAction}
                variant={accountAction === "lock" ? "dangerOutline" : "primary"}
              >
                {accountAction === "lock" ? "Lock account" : "Unlock account"}
              </Button>
            ) : null}
          </>
        }
        back={back}
        badges={<UserHeaderBadges user={user} />}
        leading={<Avatar decorative name={user.displayName} size="lg" />}
        meta={<UserHeaderMeta user={user} />}
        title={user.displayName}
      />
      {unavailable ? <AdminUnavailableHint id={hintId} /> : null}
      {notice ? (
        <Alert onDismiss={() => setNotice(null)} variant="warning">
          {notice}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-6">
          <UserAccountCard user={user} />
          <UserRolesCard
            assignable={assignable}
            assignableRoles={record.assignableRoles}
            describedBy={describedBy}
            onAssign={onAction ? requestAssignRole : undefined}
            onRemove={onAction ? requestRemoveRole : undefined}
            onSelectRole={selectRole}
            roles={user.roles}
            rolesHref={rolesHref}
            selectedRoleId={roleSelection?.roleId ?? ""}
          />
        </div>
        <div className="grid content-start gap-6">
          <UserKycCard getKycHref={getKycHref} kyc={record.kyc} />
          <UserSubscriptionCard subscription={record.subscription} />
          <UserSessionsCard
            describedBy={describedBy}
            onReload={onReload}
            onRevoke={onAction ? requestRevokeSession : undefined}
            sessions={record.sessions}
          />
        </div>
      </div>

      <UserSecurityActivityCard
        activity={record.activity}
        onReload={onReload}
      />

      {confirmation ? (
        <UserActionConfirmation
          error={confirmation.error}
          intent={confirmation.intent}
          onCancel={cancelConfirmation}
          onSubmit={(stepUp) => void submitConfirmation(stepUp)}
          open
          pending={pending}
          user={user}
        />
      ) : null}
    </section>
  );
}
