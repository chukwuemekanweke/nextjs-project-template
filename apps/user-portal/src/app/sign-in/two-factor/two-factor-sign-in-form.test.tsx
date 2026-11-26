import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

import { TwoFactorSignInForm } from "./two-factor-sign-in-form";

describe("TwoFactorSignInForm", () => {
  const markup = renderToStaticMarkup(
    createElement(TwoFactorSignInForm, { destination: "/dashboard" }),
  );

  it("starts with the authenticator code and an explicit submit", () => {
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("Two-factor verification");
    expect(markup).toContain("Authenticator code");
    expect(markup).toContain('inputMode="numeric"');
    expect(markup).toContain("Verify and sign in");
  });

  it("offers recovery codes and a way back to sign in", () => {
    expect(markup).toContain("Lost access to your authenticator?");
    expect(markup).toContain("Use a recovery code instead");
    expect(markup).toContain("Back to sign in");
  });

  it("never renders challenge data", () => {
    expect(markup).not.toMatch(/challenge/i);
  });
});
