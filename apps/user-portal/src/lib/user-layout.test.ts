import { describe, expect, it } from "vitest";
import { usesDashboardShell } from "./user-layout";

describe("user layout shell", () => {
  it.each(["/sign-in", "/sign-in/two-factor", "/register", "/confirm-email"])(
    "keeps %s outside authenticated dashboard chrome",
    (pathname) => {
      expect(usesDashboardShell(pathname)).toBe(false);
    },
  );

  it.each(["/dashboard", "/profile", "/security"])(
    "renders dashboard chrome for %s",
    (pathname) => {
      expect(usesDashboardShell(pathname)).toBe(true);
    },
  );
});
