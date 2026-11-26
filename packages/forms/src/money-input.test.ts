import { describe, expect, it } from "vitest";
import {
  compareMinorUnits,
  minorUnitsToMoneyInput,
  parseMoneyInput,
  resolveCurrencyMinorUnitDigits,
} from "./money-input";

function minor(text: string, currencyCode = "USD") {
  const result = parseMoneyInput(text, currencyCode);
  return result.ok ? result.minorUnits.toString() : result.reason;
}

describe("resolveCurrencyMinorUnitDigits", () => {
  it("resolves zero-, two- and three-digit currencies", () => {
    expect(resolveCurrencyMinorUnitDigits("JPY")).toBe(0);
    expect(resolveCurrencyMinorUnitDigits("NGN")).toBe(2);
    expect(resolveCurrencyMinorUnitDigits("KWD")).toBe(3);
  });

  it("does not guess for unknown or malformed codes", () => {
    expect(resolveCurrencyMinorUnitDigits("XYZ")).toBeUndefined();
    expect(resolveCurrencyMinorUnitDigits("usd")).toBeUndefined();
    expect(resolveCurrencyMinorUnitDigits("NG")).toBeUndefined();
    expect(resolveCurrencyMinorUnitDigits("")).toBeUndefined();
  });
});

describe("parseMoneyInput", () => {
  it("accepts plain and correctly grouped amounts", () => {
    expect(minor("5000")).toBe("500000");
    expect(minor("5,000")).toBe("500000");
    expect(minor("1,234,567.89")).toBe("123456789");
    expect(minor("  12.5  ")).toBe("1250");
    expect(minor("0.01")).toBe("1");
  });

  it("rejects incorrectly grouped amounts instead of joining digits", () => {
    for (const text of ["1,2", "1,2,3", "5,0,0,0", "12,34", "1,2345", ",100"]) {
      expect(minor(text), text).toBe("grouping");
    }
  });

  it("rejects embedded whitespace, signs, symbols and other separators", () => {
    for (const text of [
      "1 2 3",
      "1 000",
      "+5",
      "$5",
      "5.",
      ".5",
      "1.2.3",
      "1e3",
      "5,000.00.0",
      "1_000",
      "５",
    ]) {
      expect(minor(text), text).toBe("invalidFormat");
    }
  });

  it("reports empty and negative input", () => {
    expect(minor("")).toBe("empty");
    expect(minor("   ")).toBe("empty");
    expect(minor("-5")).toBe("negative");
  });

  it("returns zero as a valid amount for the caller to judge", () => {
    expect(minor("0")).toBe("0");
    expect(minor("0.00")).toBe("0");
  });

  it("rejects excess precision without rounding", () => {
    expect(minor("12.345")).toBe("precision");
    expect(minor("1.5", "JPY")).toBe("precision");
    expect(minor("1500", "JPY")).toBe("1500");
    expect(minor("1.234", "KWD")).toBe("1234");
    expect(minor("1.2345", "KWD")).toBe("precision");
    expect(minor("0.10", "USD")).toBe("10");
  });

  it("rejects currencies whose precision cannot be established", () => {
    expect(minor("10", "XYZ")).toBe("unsupportedCurrency");
    expect(minor("10", "")).toBe("unsupportedCurrency");
    expect(parseMoneyInput("10", "USD", { minorUnitDigits: -1 })).toMatchObject(
      { ok: false, reason: "unsupportedCurrency" },
    );
  });

  it("uses an authoritative precision when supplied", () => {
    expect(
      parseMoneyInput("1.2345", "XYZ", { minorUnitDigits: 4 }),
    ).toMatchObject({ minorUnits: 12345n, ok: true });
  });

  it("converts very large amounts exactly and enforces the limit", () => {
    expect(minor("90,071,992,547,409.91")).toBe("9007199254740991");
    expect(minor("90071992547409.92")).toBe("tooLarge");
    expect(
      parseMoneyInput("123456789012345678901.23", "USD", {
        maximumMinorUnits: 10n ** 30n,
      }),
    ).toMatchObject({ minorUnits: 12345678901234567890123n, ok: true });
  });
});

describe("minorUnitsToMoneyInput", () => {
  it("produces exact editable decimal strings", () => {
    expect(minorUnitsToMoneyInput(1250, "USD")).toBe("12.50");
    expect(minorUnitsToMoneyInput("5", "USD")).toBe("0.05");
    expect(
      minorUnitsToMoneyInput(500000, "USD", { omitZeroFraction: true }),
    ).toBe("5000");
    expect(minorUnitsToMoneyInput(1500, "JPY")).toBe("1500");
    expect(minorUnitsToMoneyInput(1234, "KWD")).toBe("1.234");
    expect(minorUnitsToMoneyInput(9007199254740993n, "USD")).toBe(
      "90071992547409.93",
    );
  });

  it("rejects non-integer, negative and unsupported values", () => {
    expect(minorUnitsToMoneyInput(1.5, "USD")).toBeUndefined();
    expect(minorUnitsToMoneyInput("-5", "USD")).toBeUndefined();
    expect(minorUnitsToMoneyInput("12.5", "USD")).toBeUndefined();
    expect(minorUnitsToMoneyInput(100, "XYZ")).toBeUndefined();
  });

  it("round-trips with parseMoneyInput without rounding", () => {
    for (const [value, code] of [
      ["123456789", "USD"],
      ["1", "KWD"],
      ["0", "NGN"],
      ["987654", "JPY"],
      ["9007199254740991", "USD"],
    ] as const) {
      const text = minorUnitsToMoneyInput(value, code);
      expect(text).toBeDefined();
      const parsed = parseMoneyInput(text ?? "", code);
      expect(parsed.ok && parsed.minorUnits.toString()).toBe(value);
    }
  });
});

describe("compareMinorUnits", () => {
  it("compares exactly beyond the safe integer range", () => {
    expect(compareMinorUnits("9007199254740993", "9007199254740992")).toBe(1);
    expect(compareMinorUnits(5, "5")).toBe(0);
    expect(compareMinorUnits(4n, 5)).toBe(-1);
  });
});
