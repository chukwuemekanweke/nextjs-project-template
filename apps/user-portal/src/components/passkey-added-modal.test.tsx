import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
