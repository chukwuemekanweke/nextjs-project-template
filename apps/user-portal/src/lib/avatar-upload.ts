import type {
  CompleteAvatarUploadResponse,
  CreateAvatarUploadRequest,
  CreateAvatarUploadResponse,
} from "@template/api-client/profiles";

type AvatarUploadWorkflow = {
  create: (
    request: CreateAvatarUploadRequest,
  ) => Promise<CreateAvatarUploadResponse>;
  complete: (uploadId: string) => Promise<CompleteAvatarUploadResponse>;
  fetch?: typeof globalThis.fetch;
};

export async function uploadAvatarFile(
  file: File,
  { complete, create, fetch = globalThis.fetch }: AvatarUploadWorkflow,
) {
  const upload = await create({
    fileName: file.name,
    contentType: file.type,
    contentLength: file.size,
  });
  const response = await fetch(upload.uploadUrl, {
    method: upload.method,
    headers: upload.headers,
    body: file,
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`Avatar upload failed with status ${response.status}.`);
  }

  return complete(upload.uploadId);
}
