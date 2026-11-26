import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@template/api-react/authentication", () => ({
  useRequestEmailConfirmationCode: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

import { ConfirmEmailForm } from "./confirm-email-form";

const NOW = "2026-11-26T10:00:00.000Z";

function render(
  props: Partial<Parameters<typeof ConfirmEmailForm>[0]> = {},
): string {
  return renderToStaticMarkup(
    createElement(ConfirmEmailForm, {
      initialEmail: "ada@example.com",
      initialNowUtc: NOW,
      initialRetryAtUtc: "",
      signInDestination: "/dashboard",
      ...props,
    }),
  );
}

describe("ConfirmEmailForm", () => {
  it("shows the final registration step for a known address", () => {
    const markup = render();

    expect(markup).toMatch(/aria-current="step"[^]*?Confirm email/);
    expect(markup).toContain("Check your email");
    expect(markup).toContain("<b");
    expect(markup).toContain("ada@example.com");
    expect(markup).toContain("Confirmation code");
    expect(markup).not.toContain('autoComplete="email"');
    expect(markup).toContain("Wrong address?");
    expect(markup).toContain('href="/register"');
  });

  it("asks for the address when none was supplied", () => {
    expect(render({ initialEmail: "" })).toContain('autoComplete="email"');
  });

  it("explains an unconfirmed sign-in without registration progress", () => {
    const markup = render({ emailNotConfirmed: true });

    expect(markup).not.toContain("Account setup progress");
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Email not confirmed");
    expect(markup).toContain("Back to sign in");
    expect(markup).toContain('href="/sign-in?email=ada%40example.com"');
  });

  it("shows the backend cooldown instead of the resend action", () => {
    const markup = render({ initialRetryAtUtc: "2026-11-26T10:00:40.000Z" });

    // 40 s plus the 5 s clock-skew allowance.
    expect(markup).toContain("Resend code in 0:45");
    expect(markup).not.toContain("Resend confirmation code");
    expect(render()).toContain("Resend confirmation code");
  });
});
