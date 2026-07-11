import { describe, expect, it } from "vitest";
import { portalName } from "./portal";

describe("portalName", () => {
  it("identifies the user portal", () =>
    expect(portalName).toBe("User Portal"));
});
