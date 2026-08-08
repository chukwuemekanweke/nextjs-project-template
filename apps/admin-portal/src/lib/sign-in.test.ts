import { describe, expect, it } from "vitest";
import { safeSignInDestination, safeSignInError } from "./sign-in";

describe("safeSignInDestination", () => {
  it("preserves local paths including their query and fragment", () => {
    expect(safeSignInDestination("/audit?page=2#event")).toBe(
      "/audit?page=2#event",
    );
  });

  it.each([undefined, "", "https://attacker.test", "//attacker.test/path"])(
    "rejects an unsafe destination: %s",
    (destination) => {
      expect(safeSignInDestination(destination)).toBe("/");
    },
  );
});

describe("safeSignInError", () => {
  it("uses an authorization-safe admin message", () => {
    expect(safeSignInError(403)).toBe(
      "This account is not authorized to use the admin portal.",
    );
  });

  it("does not expose unexpected response details", () => {
    expect(safeSignInError(500)).not.toContain("500");
  });
});
