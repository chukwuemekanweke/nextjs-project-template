/*
 * Reporting periods for admin filters. Ranges are whole UTC calendar days,
 * inclusive, expressed as ISO dates ("2026-11-25"); the label always says
 * "(UTC)" so administrators in other time zones read them correctly.
 */

export const ADMIN_RANGE_PRESETS = ["7d", "30d", "90d"] as const;
export type AdminRangePreset = (typeof ADMIN_RANGE_PRESETS)[number];

export const adminRangePresetLabels: Readonly<
  Record<AdminRangePreset, string>
> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const presetDays: Readonly<Record<AdminRangePreset, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export type UtcDateRange = Readonly<{ start: string; end: string }>;

/** Narrows untrusted input (a select value, a query parameter). */
export function parseAdminRangePreset(
  value: string | null | undefined,
): AdminRangePreset | null {
  return (ADMIN_RANGE_PRESETS as readonly string[]).includes(value ?? "")
    ? (value as AdminRangePreset)
    : null;
}

/** The preset's inclusive UTC days ending on `now`'s UTC date. */
export function resolveUtcRange(
  preset: AdminRangePreset,
  now: Date,
): UtcDateRange {
  const end = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const start = end - (presetDays[preset] - 1) * 86_400_000;
  return { end: isoDate(end), start: isoDate(start) };
}

const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayMonthYear = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

/** "27 Oct – 25 Nov 2026 (UTC)"; the start year shows when it differs. */
export function formatUtcRange(range: UtcDateRange): string {
  const start = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  const startLabel =
    start.getUTCFullYear() === end.getUTCFullYear()
      ? dayMonth.format(start)
      : dayMonthYear.format(start);
  return `${startLabel} – ${dayMonthYear.format(end)} (UTC)`;
}

function isoDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}
