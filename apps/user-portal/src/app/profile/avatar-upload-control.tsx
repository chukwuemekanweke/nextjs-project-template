"use client";

import {
  useCompleteAvatarUpload,
  useCreateAvatarUpload,
} from "@template/api-react/profiles";
import { Alert } from "@template/ui-core";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadAvatarFile } from "@/lib/avatar-upload";

export function AvatarUploadControl() {
  const router = useRouter();
  const createUpload = useCreateAvatarUpload();
  const completeUpload = useCompleteAvatarUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();
  const isPending = createUpload.isPending || completeUpload.isPending;

  async function upload(file: File) {
    setError(undefined);
    setConfirmation(undefined);
    try {
      await uploadAvatarFile(file, {
        create: (request) => createUpload.mutateAsync(request),
        complete: (uploadId) => completeUpload.mutateAsync({ uploadId }),
      });
      router.refresh();
      setConfirmation("Your profile photo was updated successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your profile photo could not be updated.",
      );
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {confirmation ? (
        <Alert autoDismissAfter={5_000} variant="success">
          {confirmation}
        </Alert>
      ) : null}
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
        {isPending ? "Uploading…" : "Change photo"}
        <input
          ref={inputRef}
          accept="image/*"
          className="sr-only"
          disabled={isPending}
          type="file"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
    </div>
  );
}
