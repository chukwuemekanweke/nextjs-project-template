import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  pathname: "/dashboard",
  profile: undefined as
    | undefined
    | {
        avatarUrl: string | null;
        emailAddress: string;
        firstName: string;
        isVerified: boolean;
        lastName: string;
      },
}));

vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@template/api-react/profiles", () => ({
  useCurrentProfile: () => ({ data: state.profile }),
}));
vi.mock("@template/api-react/query-client", () => ({
  useApiQueryClient: () => ({ cancelQueries: vi.fn(), clear: vi.fn() }),
}));
vi.mock("@/config/env", () => ({
  branding: {
    portals: { user: "User Portal" },
    productName: "Template",
    supportEmail: "support@example.com",
  },
}));
vi.mock("./passkey-added-modal", () => ({ PasskeyAddedModal: () => null }));

import { UserLayoutShell } from "./user-layout-shell";

const render = () =>
  renderToStaticMarkup(
    createElement(UserLayoutShell, null, createElement("p", null, "Page body")),
  );

beforeEach(() => {
  state.pathname = "/dashboard";
  state.profile = {
    avatarUrl: null,
    emailAddress: "ada.lovelace@example.com",
    firstName: "Ada",
    isVerified: true,
    lastName: "Lovelace",
  };
});

describe("UserLayoutShell", () => {
  it("leaves authentication pages outside the dashboard shell", () => {
    for (const pathname of [
      "/sign-in",
      "/sign-in/two-factor",
      "/register",
      "/forgot-password",
    ]) {
      state.pathname = pathname;
      const markup = render();
      expect(markup).toBe("<p>Page body</p>");
    }
  });

  it("shows the signed-in user's real identity, never a placeholder", () => {
    const markup = render();

    expect(markup).toContain('aria-label="Account menu for Ada Lovelace"');
    expect(markup).toContain("ada.lovelace@example.com");
    expect(markup).not.toContain("Signed-in user");
    expect(markup).not.toContain("Ada Okafor");
  });

  it("uses a neutral label until the profile is available", () => {
    state.profile = undefined;
    const markup = render();

    expect(markup).toContain('aria-label="Account menu for Your account"');
    expect(markup).toContain("User Portal");
  });

  it("marks the current section in the sidebar and tab bar", () => {
    state.pathname = "/billing/history";
    const markup = render();

    const current = markup.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];
    expect(current).toHaveLength(2);
    expect(current.every((link) => link.includes('href="/billing"'))).toBe(
      true,
    );
    expect(markup).toContain('aria-label="User navigation"');
    expect(markup).toContain('aria-label="Primary"');
  });

  it("shows Preferences in the sidebar and marks it current on /preferences", () => {
    state.pathname = "/preferences";
    const markup = render();

    const current = markup.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];
    // Sidebar only: Preferences is not a phone tab, so no tab is current.
    expect(current).toHaveLength(1);
    expect(current[0]).toContain('href="/preferences"');
    expect(markup).toMatch(/aria-current="page"[^>]*>Preferences<\/span>/);
    expect(markup).toContain(">Account<");
  });

  it("renders the reference breadcrumb trail", () => {
    state.pathname = "/billing/purchases/p-1";
    const markup = render();

    expect(markup).toMatch(/<a[^>]*href="\/billing"[^>]*>Billing<\/a>/);
    expect(markup).toMatch(
      /<a[^>]*href="\/billing\/history"[^>]*>History<\/a>/,
    );
    expect(markup).toMatch(/aria-current="page"[^>]*>Purchase<\/span>/);
  });

  it("offers support and sign out in the sidebar and keeps page content", () => {
    const markup = render();

    expect(markup).toContain('href="mailto:support@example.com"');
    // A link inside running text needs more than colour (WCAG 1.4.1).
    const supportLinkClass = markup.match(
      /<a class="([^"]*)" href="mailto:support@example.com"/,
    )?.[1];
    expect(supportLinkClass?.split(" ")).toContain("underline");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("<p>Page body</p>");
    expect(markup).toContain('id="main-content"');
  });

  it("starts with the mobile menu closed", () => {
    const markup = render();
    expect(markup).toMatch(
      /aria-expanded="false"[^>]*aria-label="Open menu"|aria-label="Open menu"[^>]*aria-expanded="false"/,
    );
    expect(markup).not.toContain('role="dialog"');
  });
});
