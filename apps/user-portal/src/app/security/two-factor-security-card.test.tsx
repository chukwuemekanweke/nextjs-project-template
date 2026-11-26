import { ApiError } from "@template/api-client";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Portalled Radix dialogs do not server-render. Dialog semantics (focus trap,
// Escape, labelling) are covered in ui-core; this stand-in exposes the
// content and footer the app passes, plus whether it may be dismissed.
vi.mock("@template/ui-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@template/ui-core")>()),
  Dialog: ({
    children,
    description,
    dismissible = true,
    footer,
    open,
    title,
  }: {
    children?: ReactNode;
    description?: ReactNode;
    dismissible?: boolean;
    footer?: ReactNode;
    open: boolean;
    title: ReactNode;
  }) =>
    open
      ? createElement(
          "div",
          { "data-dismissible": String(dismissible), role: "dialog" },
          createElement("h2", null, title),
          createElement("p", null, description),
          children,
          createElement("footer", null, footer),
        )
      : null,
}));

const useTwoFactorStatus = vi.fn();
const mutation = () => ({
  isPending: false,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
});

vi.mock("@template/api-react/authentication", () => ({
  useDisableTwoFactor: () => mutation(),
  useRegenerateRecoveryCodes: () => mutation(),
  useSetupTwoFactor: () => mutation(),
  useTwoFactorStatus: () => useTwoFactorStatus(),
  useVerifyTwoFactorEnrollment: () => mutation(),
}));

import { ProofForm, TwoFactorProofDialog } from "./two-factor-proof-dialog";
import {
  TwoFactorSecurityCard,
  TwoFactorStatusRows,
} from "./two-factor-security-card";
import {
  TwoFactorSetupDialog,
  type SetupDialogProps,
} from "./two-factor-setup-dialog";

// Test-only values; never real credentials.
const TEST_SETUP = {
  authenticatorUri: "otpauth://totp/Template:test%40example.com?secret=TESTKEY",
  sharedKey: "TESTKEYTESTKEY12",
};
const TEST_CODES = ["AAAAA11111", "BBBBB22222"];

const noop = () => undefined;

function setupDialog(overrides: Partial<SetupDialogProps>) {
  return renderToStaticMarkup(
    createElement(TwoFactorSetupDialog, {
      onBack: noop,
      onDismiss: noop,
      onFinish: noop,
      onSavedChange: noop,
      onStart: noop,
      onVerify: () => Promise.resolve(undefined),
      setup: { pending: false },
      state: { step: "closed" },
      verifying: false,
      ...overrides,
    }),
  );
}

beforeEach(() => {
  useTwoFactorStatus.mockReset();
});

describe("TwoFactorSecurityCard", () => {
  it("shows an accessible loading state that does not read as disabled", () => {
    useTwoFactorStatus.mockReturnValue({ isPending: true });
    const markup = renderToStaticMarkup(createElement(TwoFactorSecurityCard));
    expect(markup).toContain("Loading two-factor settings");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("Disabled");
    expect(markup).not.toContain("Enable");
  });

  it("shows a safe error when the status cannot be loaded", () => {
    useTwoFactorStatus.mockReturnValue({
      error: new ApiError({ kind: "forbidden", safeMessage: "x", status: 403 }),
      isError: true,
      isPending: false,
    });
    const markup = renderToStaticMarkup(createElement(TwoFactorSecurityCard));
    expect(markup).toContain("does not have permission to manage two-factor");
    expect(markup).not.toContain("Enable");
  });

  it("keeps the setup and proof dialogs closed until requested", () => {
    useTwoFactorStatus.mockReturnValue({
      data: { enabled: false, recoveryCodesRemaining: 0 },
      isPending: false,
    });
    const markup = renderToStaticMarkup(createElement(TwoFactorSecurityCard));
    expect(markup).not.toContain('role="dialog"');
  });
});

describe("TwoFactorStatusRows", () => {
  it("offers Enable when two-factor is off", () => {
    const markup = renderToStaticMarkup(
      createElement(TwoFactorStatusRows, {
        onDisable: noop,
        onEnable: noop,
        onRegenerate: noop,
        status: { enabled: false, recoveryCodesRemaining: 0 },
      }),
    );
    expect(markup).toContain("Two-factor authentication is </span>Disabled");
    expect(markup).toContain(">Enable</button>");
    expect(markup).not.toContain("Regenerate codes");
  });

  it("shows real remaining codes and the regenerate and disable actions when on", () => {
    const markup = renderToStaticMarkup(
      createElement(TwoFactorStatusRows, {
        onDisable: noop,
        onEnable: noop,
        onRegenerate: noop,
        status: { enabled: true, recoveryCodesRemaining: 7 },
      }),
    );
    expect(markup).toContain("Two-factor authentication is </span>Enabled");
    expect(markup).toContain("7 unused recovery codes. Each code works once.");
    expect(markup).toContain(">Regenerate codes</button>");
    expect(markup).toContain(">Disable</button>");
    // The contract has no enrollment date or total code count.
    expect(markup).not.toMatch(/on since|of 10/i);
  });

  it("warns when no recovery codes are left", () => {
    const markup = renderToStaticMarkup(
      createElement(TwoFactorStatusRows, {
        onDisable: noop,
        onEnable: noop,
        onRegenerate: noop,
        status: { enabled: true, recoveryCodesRemaining: 0 },
      }),
    );
    expect(markup).toContain("No recovery codes left");
  });
});

describe("TwoFactorSetupDialog", () => {
  it("renders nothing while closed", () => {
    expect(setupDialog({})).toBe("");
  });

  it("explains authenticator apps in step 1 without requesting a secret", () => {
    const markup = setupDialog({ state: { step: "intro" } });
    expect(markup).toContain("Set up two-factor authentication");
    expect(markup).toContain("Step 1 of 3");
    expect(markup).toContain(">Continue</button>");
    expect(markup).toContain('data-dismissible="true"');
    expect(markup).not.toContain("otpauth://");
  });

  it("shows a loading state while the setup secret is requested", () => {
    const markup = setupDialog({
      setup: { pending: true },
      state: { step: "scan" },
    });
    expect(markup).toContain("Preparing your authenticator setup");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Verify and continue/);
  });

  it("offers a retry when the setup request fails", () => {
    const markup = setupDialog({
      setup: { error: "Too many attempts. Try again later.", pending: false },
      state: { step: "scan" },
    });
    expect(markup).toContain("Too many attempts. Try again later.");
    expect(markup).toContain(">Try again</button>");
    expect(markup).not.toContain("Verify and continue");
  });

  it("presents the QR code, the manual key with copy, and a six-digit code field", () => {
    const markup = setupDialog({
      setup: { data: TEST_SETUP, pending: false },
      state: { step: "scan" },
    });
    expect(markup).toContain("Step 2 of 3");
    expect(markup).toContain('aria-label="Authenticator setup QR code"');
    expect(markup).toContain("TEST KEYT ESTK EY12");
    expect(markup).toContain("Copy key");
    expect(markup).toContain("Enter the 6-digit code from the app");
    expect(markup.match(/inputMode="numeric"/g)).toHaveLength(6);
    expect(markup).toMatch(
      /<button[^>]*type="submit"[^>]*>Verify and continue/,
    );
    expect(markup).toContain(">Back</button>");
  });

  it("blocks dismissal and shows a busy submit while verifying", () => {
    const markup = setupDialog({
      setup: { data: TEST_SETUP, pending: false },
      state: { step: "scan" },
      verifying: true,
    });
    expect(markup).toContain('data-dismissible="false"');
    expect(markup).toMatch(/<button[^>]*aria-busy="true"[^>]*type="submit"/);
  });

  it("shows enrollment recovery codes with download, copy and a saved-codes gate", () => {
    const markup = setupDialog({
      state: {
        codes: TEST_CODES,
        saved: false,
        source: "enrollment",
        step: "codes",
      },
    });
    expect(markup).toContain("Save your recovery codes");
    expect(markup).toContain("Step 3 of 3 · shown once");
    for (const code of TEST_CODES) expect(markup).toContain(`>${code}</li>`);
    expect(markup).toContain("Download");
    expect(markup).toContain("Copy all");
    expect(markup).toContain("I have saved my recovery codes");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Finish<\/button>/);
    expect(markup).toContain('data-dismissible="false"');
    expect(markup).not.toContain("otpauth://");
  });

  it("enables Finish once the codes are confirmed as saved", () => {
    const markup = setupDialog({
      state: {
        codes: TEST_CODES,
        saved: true,
        source: "regeneration",
        step: "codes",
      },
    });
    expect(markup).toMatch(/<button(?![^>]*disabled="")[^>]*>Finish<\/button>/);
    expect(markup).toContain(
      "Your previous recovery codes are no longer valid.",
    );
    expect(markup).toContain("checked");
  });
});

describe("TwoFactorProofDialog", () => {
  const submit = () => Promise.resolve(undefined);

  it("asks for an authenticator code by default and offers a recovery code", () => {
    const markup = renderToStaticMarkup(
      createElement(ProofForm, {
        action: "disable",
        formId: "proof",
        onSubmit: submit,
        pending: false,
      }),
    );
    expect(markup).toContain("Authenticator code");
    expect(markup.match(/inputMode="numeric"/g)).toHaveLength(6);
    expect(markup).toContain('name="verificationMethod"');
    expect(markup).toContain("Use a recovery code");
  });

  it("requires a proof to disable, never a confirm-only action", () => {
    const markup = renderToStaticMarkup(
      createElement(TwoFactorProofDialog, {
        action: "disable",
        onClose: noop,
        onSubmit: submit,
        pending: false,
      }),
    );
    expect(markup).toContain("Disable two-factor authentication?");
    expect(markup).toContain("Authenticator code");
    expect(markup).toMatch(
      /<button[^>]*form="[^"]+"[^>]*type="submit"[^>]*>Disable two-factor/,
    );
  });

  it("requires a proof to regenerate recovery codes", () => {
    const markup = renderToStaticMarkup(
      createElement(TwoFactorProofDialog, {
        action: "regenerate",
        onClose: noop,
        onSubmit: submit,
        pending: false,
      }),
    );
    expect(markup).toContain("Regenerate recovery codes?");
    expect(markup).toContain(
      "Every recovery code you saved before stops working.",
    );
    expect(markup).toContain("Authenticator code");
  });

  it("blocks dismissal and duplicate submission while the proof is checked", () => {
    const markup = renderToStaticMarkup(
      createElement(TwoFactorProofDialog, {
        action: "disable",
        onClose: noop,
        onSubmit: submit,
        pending: true,
      }),
    );
    expect(markup).toContain('data-dismissible="false"');
    expect(markup).toMatch(/<button[^>]*aria-busy="true"[^>]*type="submit"/);
  });

  it("renders nothing without an action", () => {
    expect(
      renderToStaticMarkup(
        createElement(TwoFactorProofDialog, {
          action: undefined,
          onClose: noop,
          onSubmit: submit,
          pending: false,
        }),
      ),
    ).toBe("");
  });
});
