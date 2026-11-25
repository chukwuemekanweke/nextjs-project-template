import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { adminBreadcrumbs, adminNavigation } from "./navigation";

const items = adminNavigation.flatMap((group) => group.items);

function hasPage(href: string) {
  const route = href === "/" ? "" : href;
  return existsSync(
    fileURLToPath(new URL(`../app${route}/page.tsx`, import.meta.url)),
  );
}

describe("admin navigation", () => {
  it("starts with the dashboard at the portal root", () => {
    expect(items[0]).toEqual({ label: "Dashboard", href: "/" });
  });

  it("links only to implemented routes (DR-071)", () => {
    expect(items.length).toBeGreaterThan(0);
    for (const { href } of items) {
      expect(hasPage(href), href).toBe(true);
    }
  });

  it("does not expose operational or financial screens without a backend", () => {
    const labels = items.map(({ label }) => label);
    for (const label of ["Users", "Payments", "Invoices", "Audit history"]) {
      expect(labels).not.toContain(label);
    }
  });

  it("uses unique destinations so exactly one item can be active", () => {
    const hrefs = items.map(({ href }) => href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("adminBreadcrumbs", () => {
  it("labels the dashboard and nothing else", () => {
    expect(adminBreadcrumbs("/")).toEqual([{ label: "Dashboard" }]);
    expect(adminBreadcrumbs("/users")).toEqual([]);
  });
});
