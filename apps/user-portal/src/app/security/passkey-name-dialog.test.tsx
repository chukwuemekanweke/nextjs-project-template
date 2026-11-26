import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Portalled dialogs do not server-render; this stand-in exposes the content
// and footer (dialog behaviour is covered by ui-core tests).
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
          title,
          description,
          children,
          footer,
        )
      : null,
}));

import { PasskeyNameDialog } from "./passkey-name-dialog";

const noop = () => undefined;

function render(overrides: Partial<Parameters<typeof PasskeyNameDialog>[0]>) {
  return renderToStaticMarkup(
    createElement(PasskeyNameDialog, {
      description: "Name this passkey.",
      onClose: noop,
      onSubmit: noop,
      pending: false,
      pendingLabel: "Waiting for your authenticator…",
      submitLabel: "Continue",
      title: "Add a passkey",
      ...overrides,
    }),
  );
}

describe("PasskeyNameDialog", () => {
  it("asks for a labelled, length-limited name", () => {
    const markup = render({});
    expect(markup).toContain("Add a passkey");
    expect(markup).toMatch(/<label[^>]*for="([^"]+)"[^>]*>Passkey name/);
    expect(markup).toContain('maxLength="100"');
    expect(markup).toMatch(
      /<button[^>]*form="[^"]+"[^>]*type="submit"[^>]*>Continue/,
    );
    expect(markup).toContain('data-dismissible="true"');
  });

  it("prefills the current name when renaming", () => {
    expect(
      render({ initialName: "Work laptop", title: "Rename passkey" }),
    ).toContain('value="Work laptop"');
  });

  it("locks the dialog while the authenticator ceremony is in progress", () => {
    const markup = render({ pending: true });
    expect(markup).toContain('data-dismissible="false"');
    expect(markup).toContain("Waiting for your authenticator…");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Cancel/);
    expect(markup).toMatch(/<input[^>]*disabled=""/);
  });

  it("shows a cancelled ceremony as a neutral notice", () => {
    const markup = render({
      notice: "Passkey creation was cancelled. Try again when you are ready.",
    });
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Passkey creation was cancelled.");
    expect(markup).not.toContain('role="alert"');
  });

  it("shows registration, rename or removal failures as errors", () => {
    const markup = render({
      error: "This passkey is already registered.",
    });
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("This passkey is already registered.");
  });
});
