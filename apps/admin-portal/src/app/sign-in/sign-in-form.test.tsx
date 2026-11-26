import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

import { SignInForm } from "./sign-in-form";

describe("admin SignInForm", () => {
  const markup = renderToStaticMarkup(
    createElement(SignInForm, { destination: "/" }),
  );

  it("renders the administrator sign-in with the portal chip", () => {
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("Administrator sign in");
    expect(markup).toContain("Admin portal");
    expect(markup).toContain("Work email");
    expect(markup).toContain('autoComplete="current-password"');
    expect(markup).toContain(">Continue<");
  });

  it("omits passkey and authenticator affordances the admin BFF lacks", () => {
    expect(markup).not.toMatch(/passkey/i);
    expect(markup).not.toMatch(/authenticator/i);
  });
});
