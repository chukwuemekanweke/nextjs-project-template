"use client";

import type { PasskeyResponse } from "@template/api-client/authentication";
import {
  useCompletePasskeyRegistration,
  useCreatePasskeyRegistrationOptions,
  usePasskeys,
  useRemovePasskey,
  useRenamePasskey,
} from "@template/api-react/authentication";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FingerprintIcon,
  IconTile,
  ListRow,
  PlusIcon,
  SkeletonList,
} from "@template/ui-core";
import { useCallback, useRef, useState } from "react";
import {
  describePasskeyBackup,
  describePasskeyTransports,
  passkeyRemovalError,
  passkeyRenameError,
  passkeysLoadError,
  registerPasskey,
} from "@/lib/passkey-management";
import { useWebAuthnSupport } from "@/lib/use-webauthn-support";
import { PasskeyNameDialog } from "./passkey-name-dialog";

type Dialog =
  | { kind: "add" }
  | { kind: "remove"; passkey: PasskeyResponse }
  | { kind: "rename"; passkey: PasskeyResponse };

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export function formatPasskeyDate(isoDateUtc: string): string {
  const date = new Date(isoDateUtc);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function PasskeysCard() {
  const passkeys = usePasskeys();
  const createOptions = useCreatePasskeyRegistrationOptions();
  const completeRegistration = useCompletePasskeyRegistration();
  const renamePasskey = useRenamePasskey();
  const removePasskey = useRemovePasskey();
  const supported = useWebAuthnSupport();
  const [dialog, setDialog] = useState<Dialog>();
  const [dialogKey, setDialogKey] = useState(0);
  const [dialogError, setDialogError] = useState<string>();
  const [dialogNotice, setDialogNotice] = useState<string>();
  const [registering, setRegistering] = useState(false);
  const [confirmation, setConfirmation] = useState<string>();
  const active = useRef(false);

  const pending =
    registering || renamePasskey.isPending || removePasskey.isPending;
  const dismissConfirmation = useCallback(() => setConfirmation(undefined), []);

  function open(next: Dialog) {
    if (active.current) return;
    setDialogError(undefined);
    setDialogNotice(undefined);
    setConfirmation(undefined);
    setDialogKey((key) => key + 1);
    setDialog(next);
  }

  function close() {
    if (active.current) return;
    setDialog(undefined);
  }

  async function run(action: () => Promise<void>) {
    if (active.current) return;
    active.current = true;
    setDialogError(undefined);
    setDialogNotice(undefined);
    try {
      await action();
    } finally {
      active.current = false;
    }
  }

  const add = (name: string) =>
    run(async () => {
      setRegistering(true);
      try {
        const result = await registerPasskey(name, {
          complete: completeRegistration.mutateAsync,
          createOptions: createOptions.mutateAsync,
        });
        if (result.status === "registered") {
          setDialog(undefined);
          setConfirmation(`“${result.passkey.name}” was added as a passkey.`);
        } else if (result.status === "cancelled") {
          setDialogNotice(
            "Passkey creation was cancelled. Try again when you are ready.",
          );
        } else {
          setDialogError(result.message);
        }
      } finally {
        setRegistering(false);
      }
    });

  const rename = (passkey: PasskeyResponse, name: string) =>
    run(async () => {
      try {
        await renamePasskey.mutateAsync({ credentialId: passkey.id, name });
        setDialog(undefined);
        setConfirmation(`The passkey was renamed to “${name}”.`);
      } catch (error) {
        setDialogError(passkeyRenameError(error));
      }
    });

  const remove = (passkey: PasskeyResponse) =>
    run(async () => {
      try {
        await removePasskey.mutateAsync({ credentialId: passkey.id });
        setDialog(undefined);
        setConfirmation(`“${passkey.name}” was removed.`);
      } catch (error) {
        setDialogError(passkeyRemovalError(error));
        void passkeys.refetch();
      }
    });

  const canAdd = supported === true && !pending;
  const addPasskey = () => open({ kind: "add" });

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Passkeys</CardTitle>
          <p className="text-small text-fg-muted mt-0.5">
            Sign in without a password using your device&apos;s screen lock, a
            phone, or a security key.
          </p>
        </div>
        <Button
          disabled={!canAdd}
          leadingIcon={<PlusIcon />}
          onClick={addPasskey}
          size="sm"
        >
          Add passkey
        </Button>
      </CardHeader>
      {supported === false || confirmation ? (
        <CardContent className="flex flex-col gap-3 pb-0 md:pb-0">
          {supported === false ? (
            <Alert variant="info">
              This browser cannot create passkeys. You can still manage existing
              passkeys and sign in with your password.
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
      {passkeys.isPending ? (
        <SkeletonList label="Loading passkeys" rows={2} />
      ) : passkeys.isError ? (
        <ErrorState
          description={passkeysLoadError(passkeys.error)}
          onRetry={() => void passkeys.refetch()}
          retrying={passkeys.isFetching}
          title="Passkeys unavailable"
        />
      ) : passkeys.data.length === 0 ? (
        <CardContent>
          <EmptyState
            action={
              <Button disabled={!canAdd} onClick={addPasskey} size="sm">
                Add your first passkey
              </Button>
            }
            description="Add a passkey to sign in faster and more securely."
            icon={<FingerprintIcon />}
            title="No passkeys yet"
          />
        </CardContent>
      ) : (
        <ul aria-label="Registered passkeys">
          {passkeys.data.map((passkey) => (
            <PasskeyRow
              disabled={pending}
              key={passkey.id}
              onRemove={() => open({ kind: "remove", passkey })}
              onRename={() => open({ kind: "rename", passkey })}
              passkey={passkey}
            />
          ))}
        </ul>
      )}
      {dialog?.kind === "add" ? (
        <PasskeyNameDialog
          description="Name this passkey so you can recognise it later. Your browser will then ask you to create it."
          error={dialogError}
          key={dialogKey}
          notice={dialogNotice}
          onClose={close}
          onSubmit={(name) => void add(name)}
          pending={registering}
          pendingLabel="Waiting for your authenticator…"
          submitLabel="Continue"
          title="Add a passkey"
        />
      ) : null}
      {dialog?.kind === "rename" ? (
        <PasskeyNameDialog
          description="Choose a new name for this passkey."
          error={dialogError}
          initialName={dialog.passkey.name}
          key={dialogKey}
          onClose={close}
          onSubmit={(name) => void rename(dialog.passkey, name)}
          pending={renamePasskey.isPending}
          pendingLabel="Saving…"
          submitLabel="Save name"
          title="Rename passkey"
        />
      ) : null}
      <ConfirmDialog
        confirmLabel="Remove passkey"
        description="You will no longer be able to sign in with this passkey. Remove it from your device or password manager separately if you no longer need it."
        onCancel={close}
        onConfirm={() => {
          if (dialog?.kind === "remove") void remove(dialog.passkey);
        }}
        open={dialog?.kind === "remove"}
        pending={removePasskey.isPending}
        title={
          dialog?.kind === "remove"
            ? `Remove “${dialog.passkey.name}”?`
            : "Remove passkey?"
        }
      >
        {dialogError ? <Alert variant="error">{dialogError}</Alert> : null}
      </ConfirmDialog>
    </Card>
  );
}

function PasskeyRow({
  disabled,
  onRemove,
  onRename,
  passkey,
}: Readonly<{
  disabled: boolean;
  onRemove: () => void;
  onRename: () => void;
  passkey: PasskeyResponse;
}>) {
  const transports = describePasskeyTransports(passkey.transports);
  const backup = describePasskeyBackup(passkey);
  const added = formatPasskeyDate(passkey.createdAtUtc);

  const details = [added ? `Added ${added}` : "", transports]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow
      actions={
        <>
          <Button
            aria-label={`Rename ${passkey.name}`}
            disabled={disabled}
            onClick={onRename}
            size="sm"
            variant="ghost"
          >
            Rename
          </Button>
          <Button
            aria-label={`Remove ${passkey.name}`}
            disabled={disabled}
            onClick={onRemove}
            size="sm"
            variant="dangerOutline"
          >
            Remove
          </Button>
        </>
      }
      as="li"
      description={details || undefined}
      leading={
        <IconTile tone="neutral">
          <FingerprintIcon />
        </IconTile>
      }
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-words">{passkey.name}</span>
          {backup ? <Badge>{backup}</Badge> : null}
        </span>
      }
    />
  );
}
