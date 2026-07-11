import { describe, expect, it } from "vitest";
import { portalName } from "./portal";

describe("portalName", () => {
  it("identifies the public portal", () =>
    expect(portalName).toBe("Public Portal"));
});
