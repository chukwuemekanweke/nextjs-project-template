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
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Modal,
  Skeleton,
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

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Sign in without a password using your device&apos;s screen lock, a
              phone, or a security key.
            </CardDescription>
          </div>
          <button
            className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white disabled:opacity-60"
            disabled={!canAdd}
            onClick={() => open({ kind: "add" })}
            type="button"
          >
            Add passkey
          </button>
        </div>
        <div className="mt-5 space-y-3">
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
          {passkeys.isPending ? (
            <PasskeyListSkeleton />
          ) : passkeys.isError ? (
            <Alert variant="error">{passkeysLoadError(passkeys.error)}</Alert>
          ) : passkeys.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
              <p className="font-medium text-gray-800 dark:text-white/90">
                No passkeys yet
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a passkey to sign in faster and more securely.
              </p>
              <button
                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-3 text-sm font-medium disabled:opacity-60"
                disabled={!canAdd}
                onClick={() => open({ kind: "add" })}
                type="button"
              >
                Add your first passkey
              </button>
            </div>
          ) : (
            <ul aria-label="Registered passkeys" className="space-y-3">
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
        </div>
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
        <Modal
          description="You will no longer be able to sign in with this passkey. Remove it from your device or password manager separately if you no longer need it."
          onClose={removePasskey.isPending ? undefined : close}
          open={dialog?.kind === "remove"}
          size="compact"
          title={
            dialog?.kind === "remove"
              ? `Remove “${dialog.passkey.name}”?`
              : "Remove passkey?"
          }
        >
          <div className="space-y-4">
            {dialogError ? <Alert variant="error">{dialogError}</Alert> : null}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
                disabled={removePasskey.isPending}
                onClick={close}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                disabled={removePasskey.isPending}
                onClick={() =>
                  dialog?.kind === "remove" && void remove(dialog.passkey)
                }
                type="button"
              >
                {removePasskey.isPending ? "Removing…" : "Remove passkey"}
              </button>
            </div>
          </div>
        </Modal>
      </CardContent>
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

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium break-words text-gray-800 dark:text-white/90">
            {passkey.name}
          </p>
          {backup ? (
            <span className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400">
              {backup}
            </span>
          ) : null}
        </div>
        {added ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Added {added}
          </p>
        ) : null}
        {transports ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {transports}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          aria-label={`Rename ${passkey.name}`}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
          disabled={disabled}
          onClick={onRename}
          type="button"
        >
          Rename
        </button>
        <button
          aria-label={`Remove ${passkey.name}`}
          className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={disabled}
          onClick={onRemove}
          type="button"
        >
          Remove
        </button>
      </div>
    </li>
  );
}

function PasskeyListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading passkeys"
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
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      ))}
    </div>
  );
}
