import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@template/api-react/authentication", () => ({
  useCompletePasswordReset: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
  }),
  useRequestPasswordReset: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
  }),
}));

import { ForgotPasswordFlow } from "./forgot-password-flow";
import { PasswordResetCompletionForm } from "./password-reset-completion-form";

const idle = () => Promise.resolve({ status: "stale" as const });

describe("ForgotPasswordFlow", () => {
  it("starts at the email step with an enumeration-safe explanation", () => {
    const markup = renderToStaticMarkup(
      createElement(ForgotPasswordFlow, { signInDestination: "/dashboard" }),
    );

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("Reset your password");
    expect(markup).toContain("If it matches an account");
    expect(markup).toContain('autoComplete="email"');
    expect(markup).toContain(">Send code<");
    expect(markup).toContain('href="/sign-in"');
    expect(markup).toContain("Back to sign in");
    expect(markup).not.toMatch(/no account|reset link/i);
  });

  it("keeps a validated destination on the way back to sign-in", () => {
    const markup = renderToStaticMarkup(
      createElement(ForgotPasswordFlow, {
        signInDestination: "/billing/checkout?planId=p1",
      }),
    );
    expect(markup).toContain(
      'href="/sign-in?returnTo=%2Fbilling%2Fcheckout%3FplanId%3Dp1"',
    );
  });
});

describe("PasswordResetCompletionForm", () => {
  const markup = renderToStaticMarkup(
    createElement(PasswordResetCompletionForm, {
      complete: idle,
      email: "reset@example.test",
      onChangeEmail: vi.fn(),
      onCompleted: vi.fn(),
      resend: idle,
      resendPending: false,
    }),
  );

  it("asks for the code and new password together for the accepted email", () => {
    expect(markup).toContain("Enter your reset code");
    expect(markup).toContain("reset@example.test");
    expect(markup).toContain("Change email");
    expect(markup).toContain("Reset code");
    expect(markup.match(/inputMode="numeric"/g)).toHaveLength(6);
    expect(markup).toContain('autoComplete="one-time-code"');
    expect(markup.match(/autoComplete="new-password"/g)).toHaveLength(2);
    expect(markup).toContain("Confirm new password");
    expect(markup).toContain("upper- and lowercase letters");
    expect(markup).toContain(">Reset password<");
    expect(markup).toContain("Resend code");
  });

  it("states the verified session revocation and no illustrative timer", () => {
    expect(markup).toContain("signs you out on all your devices");
    expect(markup).not.toMatch(/Resend code in|\d:\d\d/);
    expect(markup).not.toMatch(/we sent a 6-digit code to/i);
  });
});
