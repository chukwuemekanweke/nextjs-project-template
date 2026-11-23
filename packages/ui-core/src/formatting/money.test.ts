import { describe, expect, it } from "vitest";
import {
  currencyMinorUnitDigits,
  formatMinorUnits,
  minorUnitsToDecimalString,
} from "./money";

describe("minor-unit money formatting", () => {
  it("uses each currency's own minor-unit scale", () => {
    expect(currencyMinorUnitDigits("NGN")).toBe(2);
    expect(currencyMinorUnitDigits("JPY")).toBe(0);
    expect(currencyMinorUnitDigits("KWD")).toBe(3);
  });

  it("converts integers to exact decimal strings without floating point", () => {
    expect(minorUnitsToDecimalString(750000, 2)).toBe("7500.00");
    expect(minorUnitsToDecimalString("5", 2)).toBe("0.05");
    expect(minorUnitsToDecimalString(1234, 3)).toBe("1.234");
    expect(minorUnitsToDecimalString(1500, 0)).toBe("1500");
    expect(minorUnitsToDecimalString("-250", 2)).toBe("-2.50");
    expect(minorUnitsToDecimalString("90071992547409931", 2)).toBe(
      "900719925474099.31",
    );
    expect(minorUnitsToDecimalString(12.5, 2)).toBeUndefined();
    expect(minorUnitsToDecimalString("abc", 2)).toBeUndefined();
  });

  it("formats authoritative minor units for display", () => {
    // Intl separates ISO codes with a non-breaking space.
    const display = (...args: Parameters<typeof formatMinorUnits>) =>
      formatMinorUnits(...args).replace(/\s/g, " ");
    expect(display(750000, "NGN")).toBe("NGN 7,500.00");
    expect(display(2999, "USD")).toBe("$29.99");
    expect(display(1500, "JPY")).toBe("¥1,500");
    expect(display(1234, "KWD")).toBe("KWD 1.234");
  });

  it("falls back to a neutral representation instead of throwing", () => {
    expect(formatMinorUnits(100, "not-a-code")).toBe(
      "100 not-a-code (minor units)",
    );
    expect(formatMinorUnits(10.5, "USD")).toBe("10.5 USD (minor units)");
  });
});
