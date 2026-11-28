import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-paths";
import { usesDashboardShell } from "./user-layout";

describe("user layout shell", () => {
  it.each([
    "/sign-in",
    "/sign-in/two-factor",
    "/register",
    "/confirm-email",
    "/forgot-password",
    "/passkey-setup",
  ])("keeps %s outside authenticated dashboard chrome", (pathname) => {
    expect(usesDashboardShell(pathname)).toBe(false);
  });

  // FE-UI-016: anonymous pages must never show the signed-in navigation,
  // account menu or Sign out (the forgot-password page once did).
  it.each([
    "/sign-in",
    "/sign-in/two-factor",
    "/register",
    "/confirm-email",
    "/forgot-password",
  ])("gives the anonymous page %s the authentication layout", (pathname) => {
    expect(isPublicPath(pathname)).toBe(true);
    expect(usesDashboardShell(pathname)).toBe(false);
  });

  it.each(["/dashboard", "/profile", "/security"])(
    "renders dashboard chrome for %s",
    (pathname) => {
      expect(usesDashboardShell(pathname)).toBe(true);
    },
  );
});
