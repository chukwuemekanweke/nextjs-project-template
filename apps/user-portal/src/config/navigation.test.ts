import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  userBreadcrumbs,
  userNavigation,
  userTabNavigation,
} from "./navigation";

function hasPage(href: string) {
  return existsSync(
    fileURLToPath(new URL(`../app${href}/page.tsx`, import.meta.url)),
  );
}

describe("user navigation", () => {
  it("uses the dashboard as the overview destination", () => {
    expect(userNavigation[0]).toEqual({
      label: "Overview",
      href: "/dashboard",
    });
  });

  it("does not expose administrative destinations", () => {
    expect(userNavigation.some(({ href }) => href.startsWith("/admin"))).toBe(
      false,
    );
  });

  it("links only to implemented routes", () => {
    for (const { href } of [...userNavigation, ...userTabNavigation]) {
      expect(hasPage(href), href).toBe(true);
    }
  });

  it("exposes verification but not the unbuilt wallet screen", () => {
    const labels = [...userNavigation, ...userTabNavigation].map(
      ({ label }) => label,
    );
    expect(labels).not.toContain("Wallet");
    expect(userNavigation).toContainEqual({
      href: "/verification",
      label: "Verification",
    });
  });

  it("lists Preferences after Security, as in the reference sidebar", () => {
    expect(userNavigation.map(({ label }) => label)).toEqual([
      "Overview",
      "Profile",
      "Verification",
      "Billing",
      "Security",
      "Preferences",
    ]);
    expect(userNavigation.at(-1)).toEqual({
      label: "Preferences",
      href: "/preferences",
    });
  });

  it("keeps Preferences out of the phone tab bar (reached via the drawer)", () => {
    expect(userTabNavigation.map(({ label }) => label)).toEqual([
      "Home",
      "Billing",
      "Security",
      "Account",
    ]);
  });

  it("keeps the phone tab bar within five destinations", () => {
    expect(userTabNavigation.length).toBeLessThanOrEqual(5);
    expect(
      userTabNavigation.find(({ label }) => label === "Account")?.href,
    ).toBe("/profile");
  });
});

describe("userBreadcrumbs", () => {
  it("follows the reference trails", () => {
    expect(userBreadcrumbs("/dashboard")).toEqual([{ label: "Overview" }]);
    expect(userBreadcrumbs("/profile")).toEqual([
      { label: "Account" },
      { label: "Profile" },
    ]);
    expect(userBreadcrumbs("/preferences")).toEqual([
      { label: "Account" },
      { label: "Preferences" },
    ]);
    expect(userBreadcrumbs("/verification")).toEqual([
      { label: "Account" },
      { label: "Verification" },
    ]);
    expect(userBreadcrumbs("/billing/history")).toEqual([
      { label: "Billing", href: "/billing" },
      { label: "History" },
    ]);
  });

  it("resolves dynamic and nested routes to the most specific trail", () => {
    expect(userBreadcrumbs("/billing/purchases/p-123")).toEqual([
      { label: "Billing", href: "/billing" },
      { label: "History", href: "/billing/history" },
      { label: "Purchase" },
    ]);
    expect(userBreadcrumbs("/billing/checkout/success")).toEqual([
      { label: "Billing", href: "/billing" },
      { label: "Checkout" },
    ]);
  });

  it("does not match unrelated routes with a shared prefix", () => {
    expect(userBreadcrumbs("/billing-archive")).toEqual([]);
    expect(userBreadcrumbs("/unknown")).toEqual([]);
  });
});
