import type { ReactNode } from "react";
import { formatAdminDate, formatAdminDateTime } from "./admin-dates";

/*
 * Small value presentations shared by admin list and detail screens, so
 * missing values, dates and unavailable actions read the same everywhere.
 */

/** Default explanation beside an action without a wired handler. */
export const ADMIN_ACTION_UNAVAILABLE =
  "This action is not available yet: it needs an admin API.";

/** Default explanation beside filters without a live data source. */
export const ADMIN_FILTERS_UNAVAILABLE =
  "Filtering is not available yet: it needs an admin API.";

/** A dash for sighted users, "Not available" for assistive technology. */
export function AdminNotAvailable() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not available</span>
    </>
  );
}

/**
 * A source date as `<time>` in UTC, or `AdminNotAvailable` when missing,
 * invalid or (for timestamps) not zone-qualified. `dateOnly` shows only
 * the date; calendar dates ("2026-12-14") are always shown as written.
 */
export function AdminDateTime({
  dateOnly = false,
  value,
}: Readonly<{ dateOnly?: boolean; value: string | null | undefined }>) {
  const formatted = dateOnly
    ? formatAdminDate(value)
    : formatAdminDateTime(value);
  if (!formatted || !value) {
    return <AdminNotAvailable />;
  }
  return <time dateTime={value}>{formatted}</time>;
}

/**
 * Visible explanation for a disabled action or filter. Link it from the
 * control with `aria-describedby={id}`.
 */
export function AdminUnavailableHint({
  children = ADMIN_ACTION_UNAVAILABLE,
  id,
}: Readonly<{ children?: ReactNode; id: string }>) {
  return (
    <p className="text-small text-fg-subtle" id={id}>
      {children}
    </p>
  );
}
