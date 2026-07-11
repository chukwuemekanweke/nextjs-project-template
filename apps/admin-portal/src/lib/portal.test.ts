import { describe, expect, it } from "vitest";
import { portalName } from "./portal";

describe("portalName", () => {
  it("identifies the admin portal", () =>
    expect(portalName).toBe("Admin Portal"));
});
