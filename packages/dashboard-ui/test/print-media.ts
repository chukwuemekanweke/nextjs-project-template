import { cdp } from "vitest/browser";

/*
 * Print-media emulation for browser tests (Chromium only). The CDP session
 * is untyped unless provider-specific types are loaded, so the one method
 * used here is typed locally.
 */
type MediaSession = {
  send(
    method: "Emulation.setEmulatedMedia",
    params: { media: string },
  ): Promise<unknown>;
};

/** Emulates `print` media, or restores screen media with `""`. */
export function emulateMedia(media: "print" | ""): Promise<unknown> {
  return (cdp() as unknown as MediaSession).send("Emulation.setEmulatedMedia", {
    media,
  });
}
