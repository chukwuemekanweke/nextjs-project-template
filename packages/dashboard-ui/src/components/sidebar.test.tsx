import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DashboardNavGroup } from "../types";
import { DashboardSidebar, DashboardSidebarNav } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";

const groups: readonly DashboardNavGroup[] = [
  { items: [{ href: "/", label: "Dashboard" }] },
  {
    label: "Operations",
    items: [
      { href: "/billing", label: "Billing" },
      { href: "/billing/history", label: "Billing history" },
      { href: "/security", label: "Security" },
    ],
  },
];

function renderSidebar(activeHref: string, defaultExpanded = true) {
  return renderToStaticMarkup(
    <SidebarProvider defaultExpanded={defaultExpanded}>
      <DashboardSidebar
        brand={<span>Template</span>}
        brandMark={<span>T</span>}
        footer={<button type="button">Sign out</button>}
      >
        <DashboardSidebarNav
          activeHref={activeHref}
          ariaLabel="Test navigation"
          groups={groups}
        />
      </DashboardSidebar>
    </SidebarProvider>,
  );
}

describe("DashboardSidebarNav", () => {
  it("marks only the most specific destination as the current page", () => {
    const markup = renderSidebar("/billing/history/2026");

    expect(markup).toContain('aria-label="Test navigation"');
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toMatch(/aria-current="page"[^>]*href="\/billing\/history"/);
  });

  it("does not activate the root dashboard for nested routes", () => {
    const markup = renderSidebar("/security");
    expect(markup).not.toMatch(/aria-current="page"[^>]*href="\/"/);
    expect(markup).toMatch(/aria-current="page"[^>]*href="\/security"/);
  });

  it("renders group labels and names each list by its label", () => {
    const markup = renderSidebar("/");
    const labelId = /<p[^>]*id="([^"]+)"[^>]*>Operations<\/p>/.exec(
      markup,
    )?.[1];

    expect(labelId).toBeDefined();
    expect(markup).toContain(`aria-labelledby="${labelId}"`);
    expect(markup).toContain(">Billing</span>");
  });

  it("accepts a flat item list", () => {
    const markup = renderToStaticMarkup(
      <SidebarProvider>
        <DashboardSidebarNav
          activeHref="/billing"
          ariaLabel="Flat"
          items={[
            { href: "/billing", label: "Billing" },
            { href: "/security", label: "Security" },
          ]}
        />
      </SidebarProvider>,
    );
    expect(markup.match(/<li/g)).toHaveLength(2);
    expect(markup).toMatch(/aria-current="page"[^>]*href="\/billing"/);
  });
});

describe("DashboardSidebar", () => {
  it("shows labels, the brand and the footer when expanded", () => {
    const markup = renderSidebar("/");

    expect(markup).toContain("w-sidebar ");
    expect(markup).toContain("<span>Template</span>");
    expect(markup).toContain(">Sign out</button>");
    expect(markup).not.toMatch(/<a[^>]*aria-label="Billing"/);
  });

  it("names icon-only links and hides labels and footer in the rail", () => {
    const markup = renderSidebar("/billing", false);

    expect(markup).toContain("w-sidebar-collapsed");
    expect(markup).toContain("<span>T</span>");
    expect(markup).not.toContain("Sign out");
    expect(markup).not.toContain(">Billing</span>");
    for (const label of [
      "Dashboard",
      "Billing",
      "Billing history",
      "Security",
    ]) {
      expect(markup).toMatch(new RegExp(`<a[^>]*aria-label="${label}"`));
    }
    // The group label remains for assistive technology.
    expect(markup).toMatch(/<p[^>]*class="sr-only"[^>]*>Operations<\/p>/);
    expect(markup).toMatch(/aria-current="page"[^>]*aria-label="Billing"/);
  });

  it("is a desktop-only landmark", () => {
    expect(renderSidebar("/")).toMatch(
      /<aside[^>]*class="[^"]*hidden[^"]*lg:flex/,
    );
  });
});
