"use client";

import {
  useCompleteAvatarUpload,
  useCreateAvatarUpload,
} from "@template/api-react/profiles";
import { Alert } from "@template/ui-core";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import { uploadAvatarFile } from "@/lib/avatar-upload";

export function AvatarUploadControl({
  avatarUrl,
  emailAddress,
  initials,
  name,
}: Readonly<{
  avatarUrl: string | null;
  emailAddress: string;
  initials: string;
  name: string;
}>) {
  const router = useRouter();
  const createUpload = useCreateAvatarUpload();
  const completeUpload = useCompleteAvatarUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadActive = useRef(false);
  const [error, setError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const normalizedAvatarUrl = avatarUrl?.trim();
  const avatarStyle = normalizedAvatarUrl
    ? ({
        backgroundImage: `url(${JSON.stringify(normalizedAvatarUrl)})`,
      } as CSSProperties)
    : undefined;

  async function upload(file: File) {
    if (uploadActive.current) return;

    uploadActive.current = true;
    setIsUploading(true);
    setError(undefined);
    try {
      await uploadAvatarFile(file, {
        create: (request) => createUpload.mutateAsync(request),
        complete: (uploadId) => completeUpload.mutateAsync({ uploadId }),
      });
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your profile photo could not be updated.",
      );
    } finally {
      uploadActive.current = false;
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative h-20 w-20 shrink-0">
        <div
          aria-hidden="true"
          className="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex h-20 w-20 items-center justify-center rounded-full bg-cover bg-center text-2xl font-semibold"
          style={avatarStyle}
        >
          {normalizedAvatarUrl ? null : initials}
        </div>
        {isUploading ? (
          <div
            aria-label="Uploading profile photo"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-950/55"
            role="status"
          >
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
          </div>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold break-words text-gray-900 dark:text-white">
          {name}
        </p>
        <p className="mt-1 text-sm break-all text-gray-500 dark:text-gray-400">
          {emailAddress.trim()}
        </p>
        <div className="mt-3 space-y-3">
          {error ? (
            <Alert onDismiss={() => setError(undefined)} variant="error">
              {error}
            </Alert>
          ) : null}
          <button
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {isUploading ? "Uploading…" : "Change photo"}
          </button>
          <input
            ref={inputRef}
            accept="image/*"
            className="sr-only"
            disabled={isUploading}
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
      </div>
    </div>
  );
}
