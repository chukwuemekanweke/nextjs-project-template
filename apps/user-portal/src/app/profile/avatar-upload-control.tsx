"use client";

import {
  useCompleteAvatarUpload,
  useCreateAvatarUpload,
} from "@template/api-react/profiles";
import {
  Alert,
  Avatar,
  Button,
  FieldHint,
  Panel,
  Spinner,
  UploadIcon,
} from "@template/ui-core";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { uploadAvatarFile } from "@/lib/avatar-upload";
import { createAvatarUploadGuard } from "./avatar-upload-guard";

const SUCCESS_MESSAGE = "Your profile photo was updated.";

/**
 * Profile photo (reference "Photo" card). The file goes straight to object
 * storage through the signed upload sequence in `uploadAvatarFile`; the
 * profile query is invalidated by the completion mutation and the server
 * components refresh afterwards. The transport reports no byte progress, so
 * the pending state is indeterminate. Removing a photo has no API (DR-019).
 */
export function AvatarUploadControl({
  avatarUrl,
  name,
}: Readonly<{ avatarUrl: string | null; name: string }>) {
  const router = useRouter();
  const createUpload = useCreateAvatarUpload();
  const completeUpload = useCompleteAvatarUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [guard] = useState(createAvatarUploadGuard);
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();
  const [uploadingFile, setUploadingFile] = useState<string>();
  const dismissError = useCallback(() => setError(undefined), []);
  const dismissConfirmation = useCallback(() => setConfirmation(undefined), []);
  const isUploading = uploadingFile !== undefined;
  const normalizedAvatarUrl = avatarUrl?.trim() || null;

  async function upload(file: File) {
    if (guard.active) return;

    setUploadingFile(file.name);
    setError(undefined);
    setConfirmation(undefined);
    const outcome = await guard.run(() =>
      uploadAvatarFile(file, {
        create: (request) => createUpload.mutateAsync(request),
        complete: (uploadId) => completeUpload.mutateAsync({ uploadId }),
      }),
    );
    setUploadingFile(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (outcome.status === "uploaded") {
      router.refresh();
      setConfirmation(SUCCESS_MESSAGE);
    } else if (outcome.status === "failed") {
      setError(outcome.message);
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      <Avatar name={name} size="lg" src={normalizedAvatarUrl} />
      <div className="grid min-w-0 flex-1 gap-2.5">
        <div>
          <p className="text-fg font-semibold">Profile photo</p>
          <FieldHint id="avatar-hint">
            Choose an image file. Square images work best.
          </FieldHint>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            aria-describedby="avatar-hint"
            leadingIcon={<UploadIcon />}
            loading={isUploading}
            onClick={() => inputRef.current?.click()}
            size="sm"
            variant="secondary"
          >
            {isUploading ? "Uploading…" : "Upload new photo"}
          </Button>
          {normalizedAvatarUrl ? (
            <Button
              aria-describedby="avatar-remove-unavailable"
              disabled
              size="sm"
              variant="ghost"
            >
              Remove
            </Button>
          ) : null}
          <input
            ref={inputRef}
            accept="image/*"
            aria-label="Profile photo file"
            className="sr-only"
            disabled={isUploading}
            tabIndex={-1}
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
        {normalizedAvatarUrl ? (
          <FieldHint id="avatar-remove-unavailable">
            Removing a photo is not available yet. Upload a new photo to replace
            it.
          </FieldHint>
        ) : null}
        {error ? (
          <Alert onDismiss={dismissError} variant="error">
            {error}
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
      </div>
      {isUploading ? (
        <Panel
          aria-live="polite"
          className="flex w-full items-center gap-3 sm:max-w-sm"
          role="status"
        >
          <Spinner decorative size="sm" />
          <span className="text-small min-w-0 flex-1">
            <span className="text-fg block truncate">{uploadingFile}</span>
            <span className="text-fg-muted">Uploading your photo…</span>
          </span>
        </Panel>
      ) : null}
    </div>
  );
}
