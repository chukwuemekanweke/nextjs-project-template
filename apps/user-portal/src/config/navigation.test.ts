import { describe, expect, it } from "vitest";
import { userNavigation } from "./navigation";

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
});
