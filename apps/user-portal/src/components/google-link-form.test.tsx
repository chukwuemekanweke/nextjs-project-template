import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GoogleLinkForm } from "./google-link-form";

describe("GoogleLinkForm", () => {
  const markup = renderToStaticMarkup(
    createElement(GoogleLinkForm, { onRestart: vi.fn(), onSuccess: vi.fn() }),
  );

  it("asks only for the existing password", () => {
    expect(markup).toContain("Link your Google account");
    expect(markup).toContain('autoComplete="current-password"');
    expect(markup).toContain("Link and sign in");
    // The link_required outcome carries no email, so none is shown.
    expect(markup).not.toContain('type="email"');
  });

  it("always offers to restart with a different account", () => {
    expect(markup).toContain("Use a different account");
  });
});
