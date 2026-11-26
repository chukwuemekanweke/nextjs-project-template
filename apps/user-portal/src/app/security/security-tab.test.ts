import { describe, expect, it } from "vitest";
import {
  SECURITY_TABS,
  isSecurityTab,
  parseSecurityTab,
  securityTabHref,
} from "./security-tab";

describe("security tabs", () => {
  it("lists the six reference sections in order", () => {
    expect(SECURITY_TABS.map((tab) => tab.value)).toEqual([
      "overview",
      "password",
      "passkeys",
      "two-factor",
      "sessions",
      "activity",
    ]);
  });

  it("deep-links every section from ?tab=", () => {
    for (const { value } of SECURITY_TABS) {
      expect(parseSecurityTab(value)).toBe(value);
    }
    expect(parseSecurityTab(" Two-Factor ")).toBe("two-factor");
    expect(parseSecurityTab(["sessions", "activity"])).toBe("sessions");
  });

  it("falls back to the overview for missing or unknown values", () => {
    expect(parseSecurityTab(undefined)).toBe("overview");
    expect(parseSecurityTab(null)).toBe("overview");
    expect(parseSecurityTab("")).toBe("overview");
    expect(parseSecurityTab("general")).toBe("overview");
    expect(parseSecurityTab("__proto__")).toBe("overview");
    expect(isSecurityTab("devices")).toBe(false);
  });

  it("builds same-page links, keeping /security for the overview", () => {
    expect(securityTabHref("overview")).toBe("/security");
    expect(securityTabHref("two-factor")).toBe("/security?tab=two-factor");
    expect(parseSecurityTab(securityTabHref("activity").split("=")[1])).toBe(
      "activity",
    );
  });
});
