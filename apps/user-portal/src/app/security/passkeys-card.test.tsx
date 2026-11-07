import { ApiError } from "@template/api-client";
import type { PasskeyResponse } from "@template/api-client/authentication";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePasskeys = vi.fn();
const useWebAuthnSupport = vi.fn();
const idleMutation = { isPending: false, mutateAsync: vi.fn() };

vi.mock("@template/api-react/authentication", () => ({
  useCompletePasskeyRegistration: () => idleMutation,
  useCreatePasskeyRegistrationOptions: () => idleMutation,
  usePasskeys: () => usePasskeys(),
  useRemovePasskey: () => idleMutation,
  useRenamePasskey: () => idleMutation,
}));
vi.mock("@/lib/use-webauthn-support", () => ({
  useWebAuthnSupport: () => useWebAuthnSupport(),
}));

import { formatPasskeyDate, PasskeysCard } from "./passkeys-card";

function buildPasskey(overrides: Partial<PasskeyResponse> = {}) {
  return {
    createdAtUtc: "2026-11-01T10:00:00Z",
    id: "AQ",
    isBackedUp: true,
    isBackupEligible: true,
    name: "Work laptop",
    transports: ["internal", "hybrid"],
    ...overrides,
  };
}

const render = () => renderToStaticMarkup(createElement(PasskeysCard));

beforeEach(() => {
  useWebAuthnSupport.mockReturnValue(true);
});

describe("PasskeysCard", () => {
  it("shows an accessible loading state", () => {
    usePasskeys.mockReturnValue({ isPending: true });
    const markup = render();
    expect(markup).toContain("Loading passkeys");
    expect(markup).toContain('aria-busy="true"');
  });

  it("shows an empty state with an obvious first-passkey action", () => {
    usePasskeys.mockReturnValue({ data: [], isPending: false });
    const markup = render();
    expect(markup).toContain("No passkeys yet");
    expect(markup).toContain("Add your first passkey");
  });

  it("lists backend metadata with labelled rename and remove actions", () => {
    usePasskeys.mockReturnValue({
      data: [
        buildPasskey(),
        buildPasskey({
          id: "Ag",
          isBackedUp: false,
          isBackupEligible: false,
          name: "YubiKey",
          transports: ["usb"],
        }),
      ],
      isPending: false,
    });
    const markup = render();
    expect(markup).toContain('aria-label="Registered passkeys"');
    expect(markup).toContain("Work laptop");
    expect(markup).toContain("Synced");
    expect(markup).toContain("This device, Phone or tablet");
    expect(markup).toContain("USB security key");
    expect(markup).toContain(
      `Added ${formatPasskeyDate("2026-11-01T10:00:00Z")}`,
    );
    expect(markup).toContain('aria-label="Rename YubiKey"');
    expect(markup).toContain('aria-label="Remove YubiKey"');
    expect(markup).not.toContain("Last used");
  });

  it("shows a session-specific error when the list is unauthorized", () => {
    usePasskeys.mockReturnValue({
      error: new ApiError({
        kind: "forbidden",
        safeMessage: "Forbidden",
        status: 403,
      }),
      isError: true,
      isPending: false,
    });
    expect(render()).toContain("cannot manage passkeys");
  });

  it("shows a generic load error without backend details", () => {
    usePasskeys.mockReturnValue({
      error: new Error("stack trace at Foo.cs"),
      isError: true,
      isPending: false,
    });
    const markup = render();
    expect(markup).toContain("Passkeys could not be loaded");
    expect(markup).not.toContain("Foo.cs");
  });

  it("disables registration and explains when WebAuthn is unavailable", () => {
    useWebAuthnSupport.mockReturnValue(false);
    usePasskeys.mockReturnValue({ data: [buildPasskey()], isPending: false });
    const markup = render();
    expect(markup).toContain("This browser cannot create passkeys");
    expect(markup).toMatch(
      /<button[^>]*disabled=""[^>]*>Add passkey<\/button>/,
    );
    expect(markup).toMatch(
      /<button[^>]*aria-label="Remove Work laptop"(?![^>]*disabled="")/,
    );
  });

  it("ignores invalid dates instead of rendering Invalid Date", () => {
    expect(formatPasskeyDate("not-a-date")).toBe("");
  });
});
