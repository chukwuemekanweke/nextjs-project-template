---
type: architecture
title: Server and Browser Boundaries
description:
  Rules for server-only clients, browser-safe API use, secrets, cookies, and BFF
  routes
resource: okf://knowledge/architecture/server-browser-boundaries
tags: [constraint, architecture, server-only, browser, security]
governance: constraint
code_refs:
  [
    packages/api-client/src/browser/**,
    packages/api-client/src/server/**,
    apps/*/src/lib/server-api.ts,
    apps/*/src/app/api/**,
    apps/*/src/config/**,
  ]
sources:
  - kind: file
    path: packages/api-client/package.json
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

## Hard boundary

- Browser/client-component code may use `@template/api-client`, domain exports,
  `@template/api-client/browser`, and browser-safe application adapters.
- Browser code must never import `@template/api-client/server`, `next/headers`,
  server cookie helpers, private environment variables, access tokens, or
  refresh tokens.
- The server export and application server helpers import `server-only`; export
  tests protect the browser entry from `server-only`, `next/headers`, and
  `process.env` leakage.
- Only intentionally public configuration may use `NEXT_PUBLIC_*`; it is bundled
  and visible to users.

Authenticated browser workflows call same-origin application BFF routes. Route
Handlers read HttpOnly cookies, create server API clients, attach bearer tokens,
and return safe responses without exposing tokens. Public unauthenticated
operations may call the backend through the browser client when no secret is
required. Server Components and server routes use application `server-api.ts`
factories with private `API_BASE_URL`, tenant configuration, forwarded tracing
headers, and optional cookie access.
