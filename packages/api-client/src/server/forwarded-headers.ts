import "server-only";

import { isIP } from "node:net";

export const FORWARDED_FOR_HEADER = "x-forwarded-for";

const PASSTHROUGH_HEADERS = [
  "traceparent",
  "user-agent",
  "x-correlation-id",
] as const;

type RequestHeaderSource = Pick<Headers, "get">;

/**
 * Returns the browser's IP address from the `X-Forwarded-For` header added by
 * the host reverse proxy (Caddy) in front of the portal. The last entry is the
 * address the proxy observed, so a value the browser sent itself is ignored.
 */
export function readForwardedClientIp(
  requestHeaders: RequestHeaderSource,
): string | undefined {
  const forwardedFor = requestHeaders.get(FORWARDED_FOR_HEADER);
  const clientIp = forwardedFor?.split(",").at(-1)?.trim();
  return clientIp && isIP(clientIp) ? clientIp : undefined;
}

/**
 * Request headers a portal server passes to the backend API on the browser's
 * behalf: tracing, correlation, user agent, and the browser's IP address as
 * `X-Forwarded-For`.
 */
export function createForwardedRequestHeaders(
  requestHeaders: RequestHeaderSource,
): Record<string, string> {
  const forwarded: Record<string, string> = {};
  for (const name of PASSTHROUGH_HEADERS) {
    const value = requestHeaders.get(name);
    if (value) {
      forwarded[name] = value;
    }
  }
  const clientIp = readForwardedClientIp(requestHeaders);
  if (clientIp) {
    forwarded[FORWARDED_FOR_HEADER] = clientIp;
  }
  return forwarded;
}
