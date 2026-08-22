import { describe, expect, it } from "vitest";
import {
  createEmailConfirmationDestination,
  safeEmailParameter,
  safeSignInDestination,
  safeSignInError,
} from "./sign-in";

describe("createEmailConfirmationDestination", () => {
  it("carries safe email, cooldown, and return destinations", () => {
    expect(
      createEmailConfirmationDestination({
        email: " User@Example.COM ",
        retryAtUtc: "2026-08-22T11:00:00Z",
        returnTo: "/payments?page=2",
      }),
    ).toBe(
      "/confirm-email?email=user%40example.com&returnTo=%2Fpayments%3Fpage%3D2&retryAtUtc=2026-08-22T11%3A00%3A00Z",
    );
  });

  it("drops invalid timestamps and external destinations", () => {
    expect(
      createEmailConfirmationDestination({
        email: "user@example.com",
        retryAtUtc: "invalid",
        returnTo: "https://attacker.test",
      }),
    ).toBe("/confirm-email?email=user%40example.com&returnTo=%2Fdashboard");
  });
});

describe("safeEmailParameter", () => {
  it("normalizes valid emails and rejects invalid query values", () => {
    expect(safeEmailParameter(" Ada@Example.COM ")).toBe("ada@example.com");
    expect(safeEmailParameter("not-an-email")).toBe("");
    expect(safeEmailParameter(undefined)).toBe("");
  });
});

describe("safeSignInDestination", () => {
  it("preserves local paths including their query and fragment", () => {
    expect(safeSignInDestination("/payments?status=pending#latest")).toBe(
      "/payments?status=pending#latest",
    );
  });

  it.each([undefined, "", "https://attacker.test", "//attacker.test/path"])(
    "rejects an unsafe destination: %s",
    (destination) => {
      expect(safeSignInDestination(destination)).toBe("/dashboard");
    },
  );
});

describe("safeSignInError", () => {
  it("does not expose backend credential details", () => {
    expect(safeSignInError(401)).toBe("The email or password is incorrect.");
  });

  it("uses a generic message for unexpected failures", () => {
    expect(safeSignInError(500)).not.toContain("500");
  });
});
