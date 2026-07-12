import { describe, expect, it } from "vitest";
import { env, userPortalHref } from "./env";

describe("userPortalHref", () => {
  it("points calls to action to the User Portal", () => {
    expect(userPortalHref("/login")).toBe(`${env.userPortalUrl}/login`);
  });
});
