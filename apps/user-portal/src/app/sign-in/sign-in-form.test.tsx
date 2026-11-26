import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/script", () => ({ default: () => null }));
vi.mock("@template/api-react/authentication", () => ({
  useRequestEmailConfirmationCode: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/lib/use-webauthn-support", () => ({
  useWebAuthnSupport: () => true,
}));

import { SignInForm } from "./sign-in-form";

function render(props: Partial<Parameters<typeof SignInForm>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(SignInForm, {
      destination: "/dashboard",
      googleClientId: "client-id.apps.googleusercontent.com",
      initialEmail: "",
      ...props,
    }),
  );
}

describe("SignInForm", () => {
  it("renders the redesigned entry with every supported sign-in method", () => {
    const markup = render();

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("Welcome back");
    expect(markup).toContain("Continue with Google");
    expect(markup).toContain("Sign in with passkey");
    expect(markup).toContain("or with email");
    expect(markup).toContain('autoComplete="email"');
    expect(markup).toContain('autoComplete="current-password"');
    expect(markup).toContain('type="submit"');
    expect(markup).toContain(">Sign in<");
  });

  it("offers Google before passkeys, as in the design", () => {
    const markup = render();
    expect(markup.indexOf("Continue with Google")).toBeLessThan(
      markup.indexOf("Sign in with passkey"),
    );
  });

  it("omits design-only controls the backend does not support", () => {
    const markup = render();
    expect(markup).not.toContain("Keep me signed in");
    expect(markup).not.toMatch(/attempts? left/i);
  });

  it("shows the password-recovery entry point only when a route is supplied", () => {
    expect(render()).not.toContain("Forgot password?");

    const markup = render({ forgotPasswordHref: "/forgot-password" });
    expect(markup).toContain('href="/forgot-password"');
    expect(markup).toContain("Forgot password?");
  });

  it("confirms a verified email with a success status", () => {
    const markup = render({ emailConfirmed: true });
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Email confirmed");
  });

  it("keeps a validated destination on the registration link", () => {
    const markup = render({ destination: "/billing/checkout?planId=p1" });
    expect(markup).toContain(
      'href="/register?returnTo=%2Fbilling%2Fcheckout%3FplanId%3Dp1"',
    );
    expect(markup).toContain("Create an account");
  });

  it("focuses the password when the email is already known", () => {
    const markup = render({ initialEmail: "ada@example.com" });
    expect(markup).toContain('autoComplete="current-password" autofocus=""');
    expect(markup).not.toContain('autoComplete="email" autofocus=""');
  });
});
