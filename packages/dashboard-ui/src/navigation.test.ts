import { describe, expect, it } from "vitest";
import { isNavItemActive, resolveActiveNavHref } from "./navigation";

describe("isNavItemActive", () => {
  it("matches the item itself and its nested pages", () => {
    expect(isNavItemActive("/billing", "/billing")).toBe(true);
    expect(isNavItemActive("/billing", "/billing/history")).toBe(true);
    expect(isNavItemActive("/billing", "/billing/purchases/p-1")).toBe(true);
  });

  it("does not match unrelated routes that share a prefix", () => {
    expect(isNavItemActive("/billing", "/billing-archive")).toBe(false);
    expect(isNavItemActive("/user", "/users")).toBe(false);
  });

  it("treats the root as its own page, not an ancestor", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/billing")).toBe(false);
  });

  it("ignores a trailing slash", () => {
    expect(isNavItemActive("/billing", "/billing/")).toBe(true);
    expect(isNavItemActive("/billing/", "/billing")).toBe(true);
  });
});

describe("resolveActiveNavHref", () => {
  const hrefs = ["/", "/billing", "/billing/history", "/security"];

  it("returns the exact match", () => {
    expect(resolveActiveNavHref(hrefs, "/security")).toBe("/security");
  });

  it("prefers the most specific of overlapping items", () => {
    expect(resolveActiveNavHref(hrefs, "/billing/history")).toBe(
      "/billing/history",
    );
    expect(resolveActiveNavHref(hrefs, "/billing/history/2026")).toBe(
      "/billing/history",
    );
    expect(resolveActiveNavHref(hrefs, "/billing/checkout")).toBe("/billing");
  });

  it("activates the admin dashboard root only on the root", () => {
    expect(resolveActiveNavHref(hrefs, "/")).toBe("/");
    expect(resolveActiveNavHref(["/"], "/settings")).toBeUndefined();
  });

  it("returns nothing for routes outside the navigation", () => {
    expect(resolveActiveNavHref(hrefs, "/securities")).toBeUndefined();
    expect(resolveActiveNavHref([], "/billing")).toBeUndefined();
  });
});
