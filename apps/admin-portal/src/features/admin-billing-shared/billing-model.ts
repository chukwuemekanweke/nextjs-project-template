import type { ForbiddenRequestDetails } from "@/components/admin-patterns";
import type { BadgeTone } from "@template/ui-core";

/*
 * Read states, options, UTC dates and unavailable copy shared by the admin
 * billing features (Trello FE-UI-014): `admin-payments`, `admin-plans` and
 * `admin-subscriptions`. Each feature owns its own record model.
 *
 * There is no admin billing API yet (DR-070): nothing in production builds
 * these states. Future adapters (CAF-FE-012/014/015/016) map authoritative
 * backend data into them; they must not invent statuses, amounts, dates or
 * outcomes the backend did not return. Amounts stay whole minor units and
 * are formatted only with `formatMinorUnits`; dates are shown in UTC.
 */

/** Why a screen has no data in this build. */
export const ADMIN_BILLING_UNAVAILABLE_REASON =
  "The admin billing API is not available yet.";

/** Read state of a paged admin list. */
export type AdminListState<Row> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  | Readonly<{
      state: "forbidden";
      /** Only when the backend names it. */
      permission?: string;
      requestDetails?: ForbiddenRequestDetails;
    }>
  /** No source for this list; the reason is shown instead of rows. */
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{
      state: "ready";
      rows: readonly Row[];
      page: number;
      pageSize: number;
      totalPages: number;
      /** Omitted when the source does not count results. */
      totalItems?: number;
    }>;

/** Read state of one admin record. */
export type AdminDetailState<Item> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  | Readonly<{
      state: "forbidden";
      permission?: string;
      requestDetails?: ForbiddenRequestDetails;
    }>
  | Readonly<{ state: "notFound" }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "ready"; record: Item }>;

/** A selectable value supplied by a source (providers, plans, tenants). */
export type AdminOption = Readonly<{ value: string; label: string }>;

/** Options that come from a backend read. */
export type AdminOptionsState =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "error"; message?: string }>
  | Readonly<{ state: "ready"; options: readonly AdminOption[] }>;

export function readyOptions(
  options: AdminOptionsState | undefined,
): readonly AdminOption[] {
  return options?.state === "ready" ? options.options : [];
}

/** Text explaining why a set of options cannot be chosen, if any. */
export function optionsUnavailableText(
  options: AdminOptionsState | undefined,
  noun: string,
): string | undefined {
  if (!options) return `${noun} are not available yet.`;
  switch (options.state) {
    case "loading":
      return `Loading ${noun.toLowerCase()}…`;
    case "unavailable":
      return options.reason;
    case "error":
      return options.message ?? `${noun} could not be loaded.`;
    case "ready":
      return options.options.length === 0
        ? `No ${noun.toLowerCase()} to choose from.`
        : undefined;
  }
}

/* ------------------------------------------------------------------------ */
/* Statuses                                                                  */
/* ------------------------------------------------------------------------ */

export type StatusPresentation = Readonly<{ label: string; tone: BadgeTone }>;

/* ------------------------------------------------------------------------ */
/* Dates                                                                     */
/* ------------------------------------------------------------------------ */

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

function parseTimestamp(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

/** "23 Nov 2026, 18:45 UTC", or `undefined` for a missing/invalid value. */
export function formatUtcDateTime(
  value: string | null | undefined,
): string | undefined {
  const timestamp = parseTimestamp(value);
  return timestamp === undefined
    ? undefined
    : `${utcDateTime.format(timestamp)} UTC`;
}

/** "14 Dec 2026" (UTC), or `undefined`. Never substitutes the current time. */
export function formatUtcDate(
  value: string | null | undefined,
): string | undefined {
  const timestamp = parseTimestamp(value);
  return timestamp === undefined ? undefined : utcDate.format(timestamp);
}

/* ------------------------------------------------------------------------ */
/* Actions                                                                   */
/* ------------------------------------------------------------------------ */

/** Text shown with an action that has no handler in this build. */
export const UNAVAILABLE_ACTION_DESCRIPTION =
  "This action needs the admin billing API, which is not available yet.";

/** Text shown with a filter that cannot be applied in this build. */
export const UNAVAILABLE_FILTER_DESCRIPTION =
  "Filters apply once the admin billing API is available.";
