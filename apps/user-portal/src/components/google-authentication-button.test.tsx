import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: () => null,
}));

import { GoogleAuthenticationButton } from "./google-authentication-button";

describe("GoogleAuthenticationButton", () => {
  it("renders an accessible Continue with Google entry point", () => {
    const markup = renderToStaticMarkup(
      createElement(GoogleAuthenticationButton, {
        clientId: "client-id.apps.googleusercontent.com",
        onError: vi.fn(),
        onOutcome: vi.fn(),
      }),
    );

    expect(markup).toContain("Continue with Google");
    expect(markup).not.toContain("Preparing Google sign-in");
    expect(markup).not.toContain("Google sign-in is ready");
  });
});
