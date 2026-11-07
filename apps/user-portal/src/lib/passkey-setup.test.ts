import { describe, expect, it } from "vitest";
import {
  createPasskeySetupDestination,
  rememberPasskeyAdded,
  suggestPasskeyName,
  takePasskeyAdded,
} from "./passkey-setup";

describe("createPasskeySetupDestination", () => {
  it("carries a safe same-origin destination", () => {
    expect(createPasskeySetupDestination("/profile?tab=a")).toBe(
      "/passkey-setup?returnTo=%2Fprofile%3Ftab%3Da",
    );
  });

  it("falls back to the dashboard for unsafe destinations", () => {
    expect(createPasskeySetupDestination("//evil.example")).toBe(
      "/passkey-setup?returnTo=%2Fdashboard",
    );
    expect(createPasskeySetupDestination("https://evil.example")).toBe(
      "/passkey-setup?returnTo=%2Fdashboard",
    );
  });
});

describe("suggestPasskeyName", () => {
  it.each([
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit",
      "iPhone",
    ],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", "iPad"],
    ["Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/140", "Android device"],
    ["Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) Chrome/140", "Chromebook"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140", "Windows PC"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", "Mac"],
    ["Mozilla/5.0 (X11; Linux x86_64) Firefox/140", "Linux computer"],
    ["", "My passkey"],
  ])("suggests a name for %s", (userAgent, expected) => {
    expect(suggestPasskeyName(userAgent)).toBe(expected);
  });
});

describe("passkey added notice", () => {
  function memoryStorage() {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => void values.delete(key),
      setItem: (key: string, value: string) => void values.set(key, value),
    };
  }

  it("is returned once and then cleared", () => {
    const storage = memoryStorage();
    rememberPasskeyAdded("Windows PC", storage);
    expect(takePasskeyAdded(storage)).toBe("Windows PC");
    expect(takePasskeyAdded(storage)).toBeUndefined();
  });

  it("tolerates unavailable or throwing storage", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => rememberPasskeyAdded("Mac", throwing)).not.toThrow();
    expect(takePasskeyAdded(throwing)).toBeUndefined();
  });
});
