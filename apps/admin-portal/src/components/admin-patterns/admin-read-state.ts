import type { ForbiddenRequestDetails } from "./forbidden-details";

/*
 * Read states for admin screens. Only a real, wired read produces `ready`;
 * a region without a backend source is `unavailable` with its reason, never
 * an empty list, a zero or sample data.
 */

/** A backend 403 inside an admitted admin session. */
export type AdminForbiddenState = Readonly<{
  state: "forbidden";
  /** Only when the backend names the missing permission. */
  permission?: string;
  requestDetails?: ForbiddenRequestDetails;
}>;

/** One independently loaded region of a screen (card, summary, table). */
export type AdminSection<T> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "ready"; data: T }>;

/** A page of an admin list. */
export type AdminListPage<Row> = Readonly<{
  state: "ready";
  rows: readonly Row[];
  /** 1-based. */
  page: number;
  pageSize: number;
  totalPages: number;
  /** Omitted when the source does not count results. */
  totalItems?: number;
}>;

/** Read state of a paged admin list. */
export type AdminListState<Row> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  | AdminForbiddenState
  | Readonly<{ state: "unavailable"; reason: string }>
  | AdminListPage<Row>;

/** Read state of one admin record. */
export type AdminDetailState<Item> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  | AdminForbiddenState
  | Readonly<{ state: "notFound" }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "ready"; record: Item }>;

/** A selectable value supplied by a source (roles, plans, tenants). */
export type AdminOption = Readonly<{ value: string; label: string }>;

/** Options that come from a backend read. */
export type AdminOptionsState =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "ready"; options: readonly AdminOption[] }>;

/** Whether a backend-owned operation may be requested right now. */
export type AdminActionAvailability =
  | Readonly<{ state: "available"; pending?: boolean }>
  | Readonly<{ state: "unavailable"; reason: string }>;

/** The options a control may offer; none unless the read is ready. */
export function readyAdminOptions(
  options: AdminOptionsState | undefined,
): readonly AdminOption[] {
  return options?.state === "ready" ? options.options : [];
}

/** Whether `value` is one of the ready options (selection validation). */
export function isAdminOptionAvailable(
  options: AdminOptionsState | undefined,
  value: string,
): boolean {
  return readyAdminOptions(options).some((option) => option.value === value);
}

/** Why a set of options cannot be chosen from, or `undefined` when it can. */
export function adminOptionsUnavailableText(
  options: AdminOptionsState | undefined,
  noun: string,
): string | undefined {
  if (!options) {
    return `${noun} are not available yet.`;
  }
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

/**
 * True when a ready page has no rows but earlier pages may (for example
 * after records were removed). The list then offers a way back instead of
 * reading as "no results".
 */
export function isPageBeyondResults(page: AdminListPage<unknown>): boolean {
  return page.rows.length === 0 && page.page > 1;
}
