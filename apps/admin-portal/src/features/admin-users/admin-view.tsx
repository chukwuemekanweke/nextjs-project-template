import {
  ErrorState,
  LoadingStatus,
  Skeleton,
  type BadgeTone,
} from "@template/ui-core";
import type { ReactNode } from "react";
import type { ForbiddenRequestDetails } from "@/components/admin-patterns";

/*
 * Shared view helpers for the admin users, roles and KYC compositions
 * (Trello FE-UI-013). None of these screens has a backend yet: nothing in
 * production builds their models, and no route renders them. Future
 * adapters map authoritative API data into the models; values the source
 * does not report stay absent and render as "Not available", never as a
 * guess, a zero or the current time.
 */

/** One independently loaded region of a screen (card, table, summary). */
export type AdminSection<T> =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error"; message?: string }>
  /** No source for this region yet; `reason` names what is missing. */
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "ready"; data: T }>;

/** Whole-screen states shared by every list and detail model. */
export type AdminScreenBlocked =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error" }>
  /** A backend 403 inside an admitted admin session. */
  | Readonly<{
      state: "forbidden";
      details?: ForbiddenRequestDetails;
      /** Only when the backend names the missing permission. */
      permission?: string;
    }>;

/** A select option supplied by the backend (roles, plans, providers). */
export type AdminFilterOption = Readonly<{ value: string; label: string }>;

/** Status → badge text and tone. Text always carries the meaning. */
export type AdminBadge = Readonly<{ label: string; tone: BadgeTone }>;

/** Shown beside an action whose handler is not wired (no backend yet). */
export const ADMIN_ACTION_UNAVAILABLE =
  "This action is not available yet: it needs an admin API.";

/** Shown beside filter controls without a live data source. */
export const ADMIN_FILTERS_UNAVAILABLE =
  "Filtering is not available yet: it needs an admin API.";

const DISPLAY_LOCALE = "en-GB";

export type AdminDateOptions = Readonly<{
  locale?: string;
  /** Defaults to UTC, like every admin figure. */
  timeZone?: string;
}>;

function validTimestamp(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

/** "25 Nov 2026, 10:32 UTC", or `undefined` for a missing/invalid value. */
export function formatAdminDateTime(
  value: string | null | undefined,
  { locale = DISPLAY_LOCALE, timeZone = "UTC" }: AdminDateOptions = {},
): string | undefined {
  const timestamp = validTimestamp(value);
  if (timestamp === undefined) return undefined;
  const formatted = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "short",
    timeZone,
    year: "numeric",
  }).format(timestamp);
  return timeZone === "UTC" ? `${formatted} UTC` : formatted;
}

/** "25 Nov 2026", or `undefined` for a missing/invalid value. */
export function formatAdminDate(
  value: string | null | undefined,
  { locale = DISPLAY_LOCALE, timeZone = "UTC" }: AdminDateOptions = {},
): string | undefined {
  const timestamp = validTimestamp(value);
  if (timestamp === undefined) return undefined;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone,
    year: "numeric",
  }).format(timestamp);
}

/** A dash for sighted users, "Not available" for assistive technology. */
export function NotAvailable() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not available</span>
    </>
  );
}

/** A source timestamp as `<time>`, or "Not available" when absent. */
export function AdminDateTime({
  dateOnly = false,
  dates,
  value,
}: Readonly<{
  dateOnly?: boolean;
  dates?: AdminDateOptions;
  value: string | null | undefined;
}>) {
  const formatted = dateOnly
    ? formatAdminDate(value, dates)
    : formatAdminDateTime(value, dates);
  if (!formatted || !value) return <NotAvailable />;
  return <time dateTime={value}>{formatted}</time>;
}

/** Explanation linked to a disabled action with `aria-describedby`. */
export function UnavailableHint({
  children = ADMIN_ACTION_UNAVAILABLE,
  id,
}: Readonly<{ children?: ReactNode; id: string }>) {
  return (
    <p className="text-small text-fg-subtle" id={id}>
      {children}
    </p>
  );
}

/**
 * Body of an independently loaded card: skeleton, error, "Not available"
 * with its reason, or the ready content.
 */
export function AdminSectionBody<T>({
  children,
  label,
  onRetry,
  section,
}: Readonly<{
  children: (data: T) => ReactNode;
  /** Lower-case region name, for example "active sessions". */
  label: string;
  onRetry?: () => void;
  section: AdminSection<T>;
}>) {
  switch (section.state) {
    case "loading":
      return (
        <div aria-busy="true" className="grid gap-3">
          <LoadingStatus label={`Loading ${label}`} />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      );
    case "error":
      return (
        <ErrorState
          className="px-0 py-2"
          description={section.message ?? `The ${label} could not be loaded.`}
          onRetry={onRetry}
          title={`Couldn't load ${label}`}
        />
      );
    case "unavailable":
      return (
        <div data-state="unavailable">
          <p className="text-fg-muted font-medium">Not available</p>
          <p className="text-small text-fg-subtle mt-0.5">{section.reason}</p>
        </div>
      );
    case "ready":
      return <>{children(section.data)}</>;
  }
}
