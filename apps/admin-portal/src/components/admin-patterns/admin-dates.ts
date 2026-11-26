/*
 * Admin date presentation. Every admin figure is shown in UTC and labelled
 * as such (see `utc-range.ts`).
 *
 * Two kinds of value are kept apart:
 * - Timestamps (absolute instants) must carry a time zone: "Z" or an
 *   explicit offset. A zone-less value such as "2026-11-25T10:32:00" is
 *   rejected rather than read in the runtime's local zone and then
 *   mislabelled as UTC.
 * - Calendar dates ("2026-12-14") are domain dates, formatted as written
 *   with no time-zone conversion.
 * Missing or invalid values return `undefined`; callers render
 * `AdminNotAvailable`, never the current time.
 */

const TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const utcDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const utcDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

/** Epoch milliseconds of a zone-qualified ISO 8601 timestamp, if valid. */
export function parseAdminTimestamp(
  value: string | null | undefined,
): number | undefined {
  if (!value || !TIMESTAMP_PATTERN.test(value)) {
    return undefined;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

/** Epoch milliseconds of a real calendar date ("2026-02-30" is invalid). */
function parseCalendarDate(value: string): number | undefined {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (!match) {
    return undefined;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epoch = Date.UTC(year, month - 1, day);
  const date = new Date(epoch);
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return undefined;
  }
  return epoch;
}

/** "25 Nov 2026, 10:32 UTC" for a zone-qualified timestamp. */
export function formatAdminDateTime(
  value: string | null | undefined,
): string | undefined {
  const timestamp = parseAdminTimestamp(value);
  if (timestamp === undefined) {
    return undefined;
  }
  return `${utcDateTime.format(timestamp)} UTC`;
}

/**
 * "14 Dec 2026". A calendar date is shown as written; a zone-qualified
 * timestamp is shown as its UTC date.
 */
export function formatAdminDate(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }
  const epoch = parseCalendarDate(value) ?? parseAdminTimestamp(value);
  return epoch === undefined ? undefined : utcDate.format(epoch);
}
