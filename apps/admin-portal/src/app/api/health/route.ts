/**
 * Liveness endpoint for container and deployment health checks. It is outside
 * the session proxy matcher (`/api/*`), needs no browser login, never calls the
 * backend API, and exposes no configuration.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "cache-control": "no-store" } },
  );
}
