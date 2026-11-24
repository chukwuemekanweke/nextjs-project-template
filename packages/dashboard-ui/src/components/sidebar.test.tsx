import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardSidebarNav, isNavItemActive } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/billing", label: "Billing" },
  { href: "/security", label: "Security" },
];

function renderNav(activeHref: string, defaultExpanded = true) {
  return renderToStaticMarkup(
    <SidebarProvider defaultExpanded={defaultExpanded}>
      <DashboardSidebarNav
        activeHref={activeHref}
        ariaLabel="Test navigation"
        items={items}
      />
    </SidebarProvider>,
  );
}

describe("isNavItemActive", () => {
  it("matches the item itself and its nested pages", () => {
    expect(isNavItemActive("/billing", "/billing")).toBe(true);
    expect(isNavItemActive("/billing", "/billing/history")).toBe(true);
  });

  it("does not match sibling paths or treat the root as an ancestor", () => {
    expect(isNavItemActive("/billing", "/billing-archive")).toBe(false);
    expect(isNavItemActive("/", "/billing")).toBe(false);
    expect(isNavItemActive("/", "/")).toBe(true);
  });
});

describe("DashboardSidebarNav", () => {
  it("marks only the active destination as the current page", () => {
    const markup = renderNav("/security");

    expect(markup).toContain('aria-label="Test navigation"');
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toMatch(
      /aria-current="page"[^>]*class="[^"]*bg-brand-50[^"]*"[^>]*href="\/security"/,
    );
    expect(markup).not.toMatch(/bg-brand-50[^"]*"[^>]*href="\/billing"/);
  });

  it("renders visible labels in the default expanded state", () => {
    const markup = renderNav("/");

    expect(markup).toContain(">Billing</span>");
    expect(markup).not.toContain("group-hover:opacity-100");
  });

  it("keeps labels as hover/focus tooltips in the collapsed rail", () => {
    const markup = renderNav("/billing", false);

    expect(markup).not.toContain('class="min-w-0 flex-1 truncate"');
    expect(markup).toMatch(
      /group-focus-visible:opacity-100[^"]*">Billing<\/span>/,
    );
    expect(markup).toMatch(/aria-current="page"[^>]*href="\/billing"/);
  });
});
