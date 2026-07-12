import { describe, expect, it } from "vitest";
import { adminNavigation } from "./navigation";

describe("admin navigation", () => {
  it("owns the privileged operational destinations", () => {
    expect(adminNavigation.map(({ label }) => label)).toContain(
      "Roles & permissions",
    );
    expect(adminNavigation.map(({ label }) => label)).toContain(
      "Audit history",
    );
  });
});
