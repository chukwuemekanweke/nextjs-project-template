import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const idleMutation = { isPending: false, mutateAsync: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/script", () => ({ default: () => null }));
vi.mock("@template/api-react/authentication", () => ({
  useCheckEmailExistence: () => idleMutation,
  useSignUp: () => idleMutation,
}));
vi.mock("@template/api-react/reference-data", () => ({
  useCountries: () => ({
    data: [{ countryId: "ng", name: "Nigeria", shortCode: "NG" }],
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
}));

import { RegistrationForm } from "./registration-form";

function render(googleContinuation = false) {
  return renderToStaticMarkup(
    createElement(RegistrationForm, {
      destination: "/dashboard",
      googleClientId: "client-id.apps.googleusercontent.com",
      googleContinuation,
    }),
  );
}

describe("RegistrationForm", () => {
  it("starts at the email step of the three-step setup", () => {
    const markup = render();

    expect(markup).toContain('aria-label="Account setup progress"');
    expect(markup).toMatch(/aria-current="step"[^]*?Email/);
    expect(markup).toContain("Your details");
    expect(markup).toContain("Confirm email");
    expect(markup).toContain("Create your account");
    expect(markup).toContain("Continue with Google");
    expect(markup).toContain('autoComplete="email"');
    expect(markup).toContain(">Continue<");
    expect(markup).toContain('href="/sign-in"');
  });

  it("does not ask for a password or show progress after Google registration", () => {
    const markup = render(true);

    expect(markup).toContain("Finish creating your account");
    expect(markup).toContain("First name");
    expect(markup).toContain("Last name");
    expect(markup).toContain("Country");
    expect(markup).not.toContain('type="password"');
    expect(markup).not.toContain("Account setup progress");
    expect(markup).toContain("Use a different account");
  });

  it("omits design-only identity and consent fields with no backend data", () => {
    const markup = render(true);
    expect(markup).not.toContain("Signed in with Google");
    expect(markup).not.toContain('type="checkbox"');
  });
});
