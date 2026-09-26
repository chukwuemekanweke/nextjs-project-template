import { describe, expect, it } from "vitest";
import { normalizeConfirmationCode } from "./confirmation-code";

describe("normalizeConfirmationCode", () => {
  it("removes a recovery-code hyphen when pasted", () => {
    expect(normalizeConfirmationCode("c3vvn-jd5pg", "alphanumeric")).toBe(
      "C3VVNJD5PG",
    );
  });

  it("ignores a recovery-code hyphen entered between groups", () => {
    expect(normalizeConfirmationCode("C3VVN-", "alphanumeric")).toBe("C3VVN");
  });

  it("removes surrounding whitespace from copied recovery codes", () => {
    expect(normalizeConfirmationCode(" C3VVN - JD5PG ", "alphanumeric")).toBe(
      "C3VVNJD5PG",
    );
  });
});
