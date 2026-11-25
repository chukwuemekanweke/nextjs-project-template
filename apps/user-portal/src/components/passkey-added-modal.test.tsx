import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

// The shared Modal renders into a portal, which does not server-render.
// Dialog semantics (role, labelling, focus, Escape) are covered by the
// ui-core component tests; this inline stand-in exposes the content the app
// passes to the dialog.
vi.mock("@template/ui-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@template/ui-core")>()),
  Modal: ({
    children,
    description,
    footer,
    open,
    title,
  }: {
    children: ReactNode;
    description?: string;
    footer?: ReactNode;
    open: boolean;
    title: string;
  }) =>
    open
      ? createElement(
          "div",
          { "aria-label": title, role: "dialog" },
          title,
          description,
          children,
          footer,
        )
      : null,
}));

import { PasskeyAddedDialog, PasskeyAddedModal } from "./passkey-added-modal";

const onClose = () => undefined;

describe("PasskeyAddedDialog", () => {
  it("confirms the new passkey by name", () => {
    const markup = renderToStaticMarkup(
      createElement(PasskeyAddedDialog, { name: "Windows PC", onClose }),
    );
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain("Passkey added");
    expect(markup).toContain("“Windows PC” is ready");
    expect(markup).toContain("Sign in with passkey");
    expect(markup).toContain("Got it");
  });

  it("renders nothing without a pending confirmation", () => {
    expect(
      renderToStaticMarkup(
        createElement(PasskeyAddedDialog, { name: undefined, onClose }),
      ),
    ).toBe("");
  });

  it("stays closed during server rendering", () => {
    expect(renderToStaticMarkup(createElement(PasskeyAddedModal))).toBe("");
  });
});
