import { describe, expect, it } from "vitest";
import { safeSignInDestination, safeSignInError } from "./sign-in";

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
