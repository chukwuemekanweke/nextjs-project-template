import { safeSignInDestination } from "./sign-in";

export const PASSKEY_SETUP_PATH = "/passkey-setup";

/**
 * Where a newly registered user lands after their first session is issued: an
 * optional passkey prompt that continues to the original destination.
 */
export function createPasskeySetupDestination(returnTo: string): string {
  const parameters = new URLSearchParams({
    returnTo: safeSignInDestination(returnTo),
  });
  return `${PASSKEY_SETUP_PATH}?${parameters.toString()}`;
}

/** A friendly, editable default name derived only from the user agent. */
export function suggestPasskeyName(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/CrOS/i.test(userAgent)) return "Chromebook";
  if (/Windows/i.test(userAgent)) return "Windows PC";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux computer";
  return "My passkey";
}

const PASSKEY_ADDED_STORAGE_KEY = "user-portal:passkey-added";

type NoticeStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function sessionStorageOrUndefined(): NoticeStorage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

/**
 * Records the new passkey's display name so the next page can confirm it.
 * Best-effort: storage may be unavailable, and only the friendly name is kept.
 */
export function rememberPasskeyAdded(
  name: string,
  storage: NoticeStorage | undefined = sessionStorageOrUndefined(),
): void {
  try {
    storage?.setItem(PASSKEY_ADDED_STORAGE_KEY, name);
  } catch {
    // The confirmation is a convenience; registration already succeeded.
  }
}

/** Returns and clears the pending confirmation, so it is shown only once. */
export function takePasskeyAdded(
  storage: NoticeStorage | undefined = sessionStorageOrUndefined(),
): string | undefined {
  try {
    const name = storage?.getItem(PASSKEY_ADDED_STORAGE_KEY);
    if (name === null || name === undefined) return undefined;
    storage?.removeItem(PASSKEY_ADDED_STORAGE_KEY);
    return name;
  } catch {
    return undefined;
  }
}
