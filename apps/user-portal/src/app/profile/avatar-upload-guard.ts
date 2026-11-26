export type AvatarUploadOutcome =
  | Readonly<{ status: "ignored" }>
  | Readonly<{ status: "uploaded" }>
  | Readonly<{ message: string; status: "failed" }>;

const FALLBACK_MESSAGE = "Your profile photo could not be updated.";

/**
 * Allows one avatar upload at a time: a second selection while the signed
 * upload sequence (`uploadAvatarFile`) is running is ignored, never queued.
 */
export function createAvatarUploadGuard() {
  let active = false;

  return {
    get active() {
      return active;
    },
    async run(task: () => Promise<unknown>): Promise<AvatarUploadOutcome> {
      if (active) return { status: "ignored" };
      active = true;
      try {
        await task();
        return { status: "uploaded" };
      } catch (caughtError) {
        return {
          message:
            caughtError instanceof Error && caughtError.message
              ? caughtError.message
              : FALLBACK_MESSAGE,
          status: "failed",
        };
      } finally {
        active = false;
      }
    },
  };
}
