import { describe, expect, it } from "vitest";
import { activeNavigationHref } from "./navigation";

const items = [
  { label: "Product", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

describe("activeNavigationHref", () => {
  it("matches home only at the root", () => {
    expect(activeNavigationHref(items, "/")).toBe("/");
    expect(activeNavigationHref(items, "/privacy")).toBeUndefined();
  });

  it("matches a section and its nested pages", () => {
    expect(activeNavigationHref(items, "/pricing")).toBe("/pricing");
    expect(activeNavigationHref(items, "/pricing/")).toBe("/pricing");
    expect(activeNavigationHref(items, "/blog/launch")).toBe("/blog");
  });

  it("does not match on a shared prefix alone", () => {
    expect(activeNavigationHref(items, "/blogging")).toBeUndefined();
  });

  it("returns nothing before the path is known", () => {
    expect(activeNavigationHref(items, null)).toBeUndefined();
  });
});
