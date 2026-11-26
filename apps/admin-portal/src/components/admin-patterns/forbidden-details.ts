import { isApiError } from "@template/api-client";

/*
 * Safe, non-secret details for the admin 403 view. Only an allow-listed
 * shape ever reaches the screen or the clipboard: status, path (no query or
 * fragment, which can carry personal data), a correlation/request id and a
 * UTC timestamp. Tokens, headers, backend messages and exception text are
 * never included.
 */

export type ForbiddenRequestDetails = Readonly<{
  path?: string;
  requestId?: string;
  /** ISO 8601 timestamp of the denied request. */
  occurredAt?: string;
}>;

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:|-]{1,128}$/;
const PERMISSION_PATTERN = /^[a-z][a-z0-9_.:-]{0,99}$/i;

/** Drops anything that is not a plain path, request id or timestamp. */
export function sanitizeForbiddenDetails(
  details: ForbiddenRequestDetails,
): ForbiddenRequestDetails {
  const path = details.path?.split(/[?#]/, 1)[0]?.trim();
  const requestId = details.requestId?.trim();
  const occurredAt = details.occurredAt
    ? new Date(details.occurredAt)
    : undefined;
  return {
    ...(path && path.startsWith("/") && !path.startsWith("//")
      ? { path: path.slice(0, 200) }
      : {}),
    ...(requestId && REQUEST_ID_PATTERN.test(requestId) ? { requestId } : {}),
    ...(occurredAt && !Number.isNaN(occurredAt.getTime())
      ? { occurredAt: occurredAt.toISOString() }
      : {}),
  };
}

/** True when there is something worth copying for support. */
export function hasForbiddenDetails(details: ForbiddenRequestDetails): boolean {
  return Boolean(details.path || details.requestId);
}

/** Plain-text block for "Copy request details". */
export function formatForbiddenDetails(
  details: ForbiddenRequestDetails,
): string {
  const safe = sanitizeForbiddenDetails(details);
  return [
    "Status: 403 Forbidden",
    safe.path ? `Path: ${safe.path}` : null,
    safe.requestId ? `Request ID: ${safe.requestId}` : null,
    safe.occurredAt ? `Time (UTC): ${safe.occurredAt}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** A permission name fit to display, or undefined (never invented). */
export function safePermissionName(
  permission: string | undefined,
): string | undefined {
  const trimmed = permission?.trim();
  return trimmed && PERMISSION_PATTERN.test(trimmed) ? trimmed : undefined;
}

/**
 * For a caught backend error: the safe details when it is a 403, otherwise
 * null (render the ordinary error state instead).
 */
export function forbiddenDetailsFromError(
  error: unknown,
  context: Readonly<{ path?: string; occurredAt?: string }> = {},
): ForbiddenRequestDetails | null {
  if (!isApiError(error) || error.status !== 403) return null;
  return sanitizeForbiddenDetails({
    occurredAt: context.occurredAt,
    path: context.path,
    requestId: error.correlationId ?? error.traceId,
  });
}
