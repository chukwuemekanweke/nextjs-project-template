import { describe, expect, it, vi } from "vitest";
import { uploadAvatarFile } from "./avatar-upload";

const session = {
  uploadId: "1d130feb-40d9-4ec9-9957-3827dfe02dc5",
  uploadUrl: "https://signed-storage.test/quarantine/avatar",
  method: "PUT",
  headers: {
    "Content-Type": "image/png",
    "x-amz-checksum-sha256": "checksum",
  },
  expiresAtUtc: "2026-09-24T10:05:00Z",
};

const createFile = () =>
  new File(["avatar-bytes"], "portrait.png", { type: "image/png" });

describe("avatar upload workflow", () => {
  it("uploads directly with only signed-request options before completion", async () => {
    const file = createFile();
    const create = vi.fn().mockResolvedValue(session);
    const complete = vi
      .fn()
      .mockResolvedValue({ avatarUrl: "https://cdn.test/avatar.png" });
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(
      uploadAvatarFile(file, { create, complete, fetch }),
    ).resolves.toEqual({ avatarUrl: "https://cdn.test/avatar.png" });

    expect(create).toHaveBeenCalledWith({
      fileName: "portrait.png",
      contentType: "image/png",
      contentLength: file.size,
    });
    expect(fetch).toHaveBeenCalledWith(session.uploadUrl, {
      method: session.method,
      headers: session.headers,
      body: file,
      credentials: "omit",
    });
    const request = fetch.mock.calls[0]?.[1];
    const headers = new Headers(request?.headers);
    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("X-Tenant-Id")).toBeNull();
    expect(request?.credentials).toBe("omit");
    expect(complete).toHaveBeenCalledWith(session.uploadId);
    expect(fetch.mock.invocationCallOrder[0]).toBeLessThan(
      complete.mock.invocationCallOrder[0]!,
    );
  });

  it("does not complete when the signed upload fails", async () => {
    const complete = vi.fn();

    await expect(
      uploadAvatarFile(createFile(), {
        create: vi.fn().mockResolvedValue(session),
        complete,
        fetch: vi
          .fn<typeof globalThis.fetch>()
          .mockResolvedValue(new Response(null, { status: 403 })),
      }),
    ).rejects.toThrow("Avatar upload failed with status 403.");

    expect(complete).not.toHaveBeenCalled();
  });
});
