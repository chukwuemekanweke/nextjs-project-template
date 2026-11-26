/*
 * Strict parsing of typed monetary amounts into whole minor currency units.
 *
 * Domain-neutral: callers own business rules (minimums, maximums, whether
 * zero is allowed) and all user-facing copy. Parsing never uses binary
 * floating point and never rounds: an amount with more decimal places than
 * the currency allows is rejected, not adjusted.
 *
 * Supported input format: ASCII digits, an optional "." decimal separator,
 * and optional "," thousands separators in groups of exactly three
 * ("1,234,567.89"). Surrounding whitespace is ignored; embedded whitespace,
 * signs, currency symbols and other separators are rejected. Formatting for
 * display stays in `formatMinorUnits` (`@template/ui-core`).
 */

export type MoneyInputErrorReason =
  /** Nothing was entered. */
  | "empty"
  /** Not a decimal amount in the supported format. */
  | "invalidFormat"
  /** Thousands separators are not in groups of three ("1,2", "5,0,0,0"). */
  | "grouping"
  /** A leading minus sign. */
  | "negative"
  /** More decimal places than the currency allows. */
  | "precision"
  /** The currency's minor-unit precision cannot be established. */
  | "unsupportedCurrency"
  /** Larger than the representable maximum. */
  | "tooLarge";

export type MoneyInputResult =
  | Readonly<{ ok: true; minorUnits: bigint; minorUnitDigits: number }>
  | Readonly<{
      ok: false;
      reason: MoneyInputErrorReason;
      /** Known when the currency resolved; useful for precision copy. */
      minorUnitDigits?: number;
    }>;

export type MoneyInputOptions = Readonly<{
  /**
   * Inclusive representation limit in minor units. Defaults to
   * `Number.MAX_SAFE_INTEGER`, so a parsed amount can always be sent as an
   * exact JSON number.
   */
  maximumMinorUnits?: bigint;
  /**
   * Precision supplied by an authoritative source (for example a backend
   * currency record). When omitted it is resolved from `Intl`.
   */
  minorUnitDigits?: number;
}>;

const PLAIN_AMOUNT = /^\d+(?:\.\d+)?$/;
const GROUPED_AMOUNT = /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
const CURRENCY_CODE = /^[A-Z]{3}$/;
const MAX_MINOR_UNIT_DIGITS = 6;

let supportedCurrencies: ReadonlySet<string> | undefined;

function isSupportedCurrency(currencyCode: string): boolean {
  if (!supportedCurrencies) {
    supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));
  }
  return supportedCurrencies.has(currencyCode);
}

/**
 * The minor-unit digits of an ISO 4217 currency `Intl` knows (JPY 0, NGN 2,
 * KWD 3), or `undefined`. Unlike a formatter lookup it does not assume two
 * digits for a well-formed but unknown code such as "XYZ".
 */
export function resolveCurrencyMinorUnitDigits(
  currencyCode: string,
): number | undefined {
  if (!CURRENCY_CODE.test(currencyCode) || !isSupportedCurrency(currencyCode)) {
    return undefined;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      currency: currencyCode,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits;
  } catch {
    return undefined;
  }
}

function resolveDigits(
  currencyCode: string,
  suppliedDigits: number | undefined,
): number | undefined {
  if (suppliedDigits === undefined) {
    return resolveCurrencyMinorUnitDigits(currencyCode);
  }
  if (
    Number.isInteger(suppliedDigits) &&
    suppliedDigits >= 0 &&
    suppliedDigits <= MAX_MINOR_UNIT_DIGITS
  ) {
    return suppliedDigits;
  }
  return undefined;
}

/**
 * Parses a typed major-unit amount ("12,500.50") into exact minor units.
 * Zero is returned as a valid amount; whether it is acceptable is the
 * caller's rule.
 */
export function parseMoneyInput(
  text: string,
  currencyCode: string,
  {
    maximumMinorUnits = BigInt(Number.MAX_SAFE_INTEGER),
    minorUnitDigits,
  }: MoneyInputOptions = {},
): MoneyInputResult {
  const digits = resolveDigits(currencyCode, minorUnitDigits);
  if (digits === undefined) {
    return { ok: false, reason: "unsupportedCurrency" };
  }

  const value = text.trim();
  if (value === "") {
    return { minorUnitDigits: digits, ok: false, reason: "empty" };
  }
  if (value.startsWith("-")) {
    return { minorUnitDigits: digits, ok: false, reason: "negative" };
  }

  let ungrouped: string;
  if (PLAIN_AMOUNT.test(value)) {
    ungrouped = value;
  } else if (GROUPED_AMOUNT.test(value)) {
    ungrouped = value.replaceAll(",", "");
  } else if (/^[\d,]+(?:\.\d+)?$/.test(value)) {
    return { minorUnitDigits: digits, ok: false, reason: "grouping" };
  } else {
    return { minorUnitDigits: digits, ok: false, reason: "invalidFormat" };
  }

  const [whole, fraction = ""] = ungrouped.split(".");
  if (fraction.length > digits) {
    return { minorUnitDigits: digits, ok: false, reason: "precision" };
  }

  const minorUnits = BigInt(`${whole}${fraction.padEnd(digits, "0")}`);
  if (minorUnits > maximumMinorUnits) {
    return { minorUnitDigits: digits, ok: false, reason: "tooLarge" };
  }
  return { minorUnitDigits: digits, minorUnits, ok: true };
}

/**
 * Editable text for an authoritative minor-unit amount ("1250" in a
 * 2-digit currency → "12.50"; with `omitZeroFraction`, 500000 → "5000").
 * Returns `undefined` when the amount is not a non-negative integer or the
 * currency precision is unknown.
 */
export function minorUnitsToMoneyInput(
  minorUnits: number | string | bigint,
  currencyCode: string,
  {
    minorUnitDigits,
    omitZeroFraction = false,
  }: Readonly<{ minorUnitDigits?: number; omitZeroFraction?: boolean }> = {},
): string | undefined {
  const digits = resolveDigits(currencyCode, minorUnitDigits);
  if (digits === undefined) {
    return undefined;
  }

  let raw: string;
  if (typeof minorUnits === "number") {
    if (!Number.isSafeInteger(minorUnits)) {
      return undefined;
    }
    raw = minorUnits.toString();
  } else {
    raw = minorUnits.toString().trim();
  }
  if (!/^\d+$/.test(raw)) {
    return undefined;
  }

  const padded = raw.replace(/^0+(?=\d)/, "").padStart(digits + 1, "0");
  if (digits === 0) {
    return padded;
  }
  const whole = padded.slice(0, -digits);
  const fraction = padded.slice(-digits);
  if (omitZeroFraction && /^0+$/.test(fraction)) {
    return whole;
  }
  return `${whole}.${fraction}`;
}

/** Compares two integer minor-unit amounts exactly (-1, 0 or 1). */
export function compareMinorUnits(
  left: number | string | bigint,
  right: number | string | bigint,
): number {
  const a = BigInt(left);
  const b = BigInt(right);
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}
