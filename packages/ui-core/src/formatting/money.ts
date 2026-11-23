/**
 * Presentation-only formatting for authoritative amounts expressed in whole
 * minor currency units (for example kobo or cents). Conversion uses decimal
 * string arithmetic, never binary floating point, and the currency's own
 * minor-unit scale from `Intl` (JPY 0, NGN 2, KWD 3, ...).
 */

const DEFAULT_LOCALE = "en-US";
const INTEGER_PATTERN = /^-?\d+$/;

export type MoneyFormatOptions = Readonly<{ locale?: string }>;

function currencyFormatter(currencyCode: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency: currencyCode,
    style: "currency",
  });
}

/** The number of minor-unit digits `Intl` uses for a currency, if known. */
export function currencyMinorUnitDigits(
  currencyCode: string,
  locale: string = DEFAULT_LOCALE,
): number | undefined {
  try {
    return currencyFormatter(currencyCode, locale).resolvedOptions()
      .maximumFractionDigits;
  } catch {
    return undefined;
  }
}

/** Converts an integer minor-unit amount to an exact decimal string. */
export function minorUnitsToDecimalString(
  minorUnits: number | string | bigint,
  digits: number,
): string | undefined {
  const raw =
    typeof minorUnits === "number"
      ? Number.isSafeInteger(minorUnits)
        ? minorUnits.toString()
        : undefined
      : minorUnits.toString().trim();
  if (!raw || !INTEGER_PATTERN.test(raw)) {
    return undefined;
  }
  const negative = raw.startsWith("-");
  const digitsOnly = (negative ? raw.slice(1) : raw).replace(/^0+(?=\d)/, "");
  if (digits === 0) {
    return `${negative ? "-" : ""}${digitsOnly}`;
  }
  const padded = digitsOnly.padStart(digits + 1, "0");
  const whole = padded.slice(0, -digits);
  const fraction = padded.slice(-digits);
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/**
 * Formats whole minor units for display. Returns a neutral representation
 * rather than throwing when the currency or amount cannot be interpreted.
 */
export function formatMinorUnits(
  minorUnits: number | string | bigint,
  currencyCode: string,
  { locale = DEFAULT_LOCALE }: MoneyFormatOptions = {},
): string {
  const digits = currencyMinorUnitDigits(currencyCode, locale);
  const decimal =
    digits === undefined
      ? undefined
      : minorUnitsToDecimalString(minorUnits, digits);
  if (digits === undefined || decimal === undefined) {
    return `${String(minorUnits)} ${currencyCode} (minor units)`;
  }
  // Intl.NumberFormat formats decimal strings exactly (ES2023); the cast only
  // widens the ES2022 type declaration this workspace compiles against.
  const format = currencyFormatter(currencyCode, locale).format as unknown as (
    value: string,
  ) => string;
  return format(decimal);
}
