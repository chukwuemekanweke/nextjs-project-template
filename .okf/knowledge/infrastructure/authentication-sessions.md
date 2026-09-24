---
type: infrastructure
title: Authentication and Session Infrastructure
description:
  Cookie sessions, BFF endpoints, protected routes, refresh coordination,
  expiration, and admin admission
resource: okf://knowledge/infrastructure/authentication-sessions
tags: [constraint, infrastructure, authentication, sessions, concurrency]
governance: constraint
code_refs:
  [
    packages/api-client/src/authentication/session-route.ts,
    packages/api-client/src/browser/**,
    apps/user-portal/src/lib/session-*.ts,
    apps/user-portal/src/proxy.ts,
    apps/user-portal/src/app/api/auth/session/**,
    apps/admin-portal/src/lib/session-*.ts,
    apps/admin-portal/src/proxy.ts,
    apps/admin-portal/src/app/api/auth/session/**,
  ]
sources:
  - kind: file
    path: packages/api-client/src/browser/refresh-coordinated-fetch.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

User and Admin sessions use separate secure, HttpOnly, SameSite=Lax, path-rooted
`__Host-` access and refresh cookies. Expiry is shortened by a safety window.
Tokens remain server-side; BFF session routes sign in, refresh, log out,
set/clear cookies, and return only safe session metadata.

User Portal Google authentication starts through a BFF route that stores the
backend's opaque flow token in the short-lived, secure, HttpOnly
`__Host-user-google-auth-flow` cookie and returns only nonce/expiry to the
browser. GIS returns an ID credential that browser memory immediately posts to
the BFF. Authenticated, password-link, and profile-only registration outcomes
all issue the existing access/refresh cookies through `setSessionCookies`;
continuations preserve the flow cookie and successful or terminal flows clear
it. Neither the flow token nor application tokens enter browser state or URLs.

Protected-route proxies validate access-token time claims and refresh from the
refresh cookie when needed. Refreshes are deduplicated per refresh token.
Unauthenticated results clear cookies and redirect to sign-in with `returnTo`.
Admin sessions also require the configured role on initial admission and every
protected-route/refresh decision; rejected sessions are logged out best-effort
and never persisted. Backend authorization is still authoritative.

Browser `sessionFetch` refreshes only eligible same-origin, non-auth requests
after a 401. It clones retryable Request objects, coordinates one active
refresh, records a session version so concurrent requests reuse a completed
refresh, retries once, then performs terminal expiration/logout and redirect
once. Preserve active-operation promises, version checks, request cloning,
one-retry limits, and expiration guards; they prevent refresh races and loops.
