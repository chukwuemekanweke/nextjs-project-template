import { describe, expect, it } from "vitest";
import { hasRequiredAdminRole } from "./admin-authorization";

function token(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
}

describe("hasRequiredAdminRole", () => {
  it.each([
    { role: "Administrator" },
    { roles: ["Support", "Administrator"] },
    {
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
        "Administrator",
    },
  ])("accepts supported role claim shapes", (payload) => {
    expect(hasRequiredAdminRole(token(payload), "administrator")).toBe(true);
  });

  it.each([
    token({ role: "User" }),
    token({ email: "admin@example.com" }),
    "not-a-token",
  ])("fails closed without the required role", (accessToken) => {
    expect(hasRequiredAdminRole(accessToken, "Administrator")).toBe(false);
  });
});
