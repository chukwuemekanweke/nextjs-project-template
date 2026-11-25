import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@template/api-react/query-client", () => ({
  useApiQueryClient: () => ({ cancelQueries: vi.fn(), clear: vi.fn() }),
}));
vi.mock("@/config/env", () => ({
  branding: { portals: { admin: "Admin Portal" }, productName: "Template" },
}));

import { AdminLayoutShell } from "./admin-layout-shell";

const render = () =>
  renderToStaticMarkup(
    createElement(
      AdminLayoutShell,
      null,
      createElement("p", null, "Page body"),
    ),
  );

beforeEach(() => {
  state.pathname = "/";
});

describe("AdminLayoutShell", () => {
  it("leaves the sign-in page outside the dashboard shell", () => {
    state.pathname = "/sign-in";
    expect(render()).toBe("<p>Page body</p>");
  });

  it("links only to implemented admin routes", () => {
    const markup = render();
    const hrefs = [...markup.matchAll(/<a[^>]*href="([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(new Set(hrefs)).toEqual(new Set(["/", "#main-content"]));
    expect(markup).not.toContain("Workspace settings");
    expect(markup).not.toContain("Review audit events");
  });

  it("marks the dashboard as current only on the root", () => {
    expect(render()).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/"/);
    state.pathname = "/unknown";
    expect(render()).not.toContain('aria-current="page"');
  });

  it("brands the portal and shows the admitted role, not a person", () => {
    const markup = render();

    expect(markup).toContain(">Admin</span>");
    expect(markup).toContain('aria-label="Account menu for Administrator"');
    expect(markup).not.toContain("Signed-in administrator");
    expect(markup).toContain("Sign out");
  });

  it("has no phone tab bar (admin reference uses the drawer only)", () => {
    expect(render()).not.toContain('aria-label="Primary"');
  });
});
