import { describe, expect, it } from "vitest";
import { FORGOT_PASSWORD_PATH, isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  it("serves the anonymous authentication pages without a session", () => {
    for (const path of [
      "/sign-in",
      "/sign-in/two-factor",
      "/register",
      "/confirm-email",
      FORGOT_PASSWORD_PATH,
    ]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("keeps every application page protected", () => {
    for (const path of [
      "/",
      "/dashboard",
      "/security",
      "/profile",
      "/billing",
      "/verification",
      "/passkey-setup",
      "/forgot-password/extra",
      "/reset-password",
      "/FORGOT-PASSWORD",
    ]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});
