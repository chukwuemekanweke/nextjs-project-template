import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const useWebAuthnSupport = vi.fn();

vi.mock("@/lib/use-webauthn-support", () => ({
  useWebAuthnSupport: () => useWebAuthnSupport(),
}));

import { PasskeySignInButton } from "./passkey-sign-in-button";

function render(props: { disabled?: boolean } = {}) {
  return renderToStaticMarkup(
    createElement(PasskeySignInButton, { onOutcome: vi.fn(), ...props }),
  );
}

describe("PasskeySignInButton", () => {
  it("offers a clearly labelled passkey option when supported", () => {
    useWebAuthnSupport.mockReturnValue(true);
    const markup = render();
    expect(markup).toContain("Sign in with passkey");
    expect(markup).not.toContain('disabled=""');
  });

  it("stays disabled until browser support is known", () => {
    useWebAuthnSupport.mockReturnValue(undefined);
    expect(render()).toContain('disabled=""');
  });

  it("explains the fallback when passkeys are unavailable", () => {
    useWebAuthnSupport.mockReturnValue(false);
    const markup = render();
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-describedby="passkey-unsupported"');
    expect(markup).toContain("Use another sign-in method.");
  });

  it("is disabled while another sign-in method is in progress", () => {
    useWebAuthnSupport.mockReturnValue(true);
    expect(render({ disabled: true })).toContain('disabled=""');
  });
});
