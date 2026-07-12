import { describe, expect, it } from "vitest";
import { userNavigation } from "./navigation";

describe("user navigation", () => {
  it("does not expose administrative destinations", () => {
    expect(userNavigation.some(({ href }) => href.startsWith("/admin"))).toBe(
      false,
    );
  });
});
