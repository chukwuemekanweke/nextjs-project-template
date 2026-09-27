---
type: domain
title: Authentication Product Workflows
description:
  Customer and administrator authentication workflows, including User Portal
  authenticator MFA
resource: okf://knowledge/domains/authentication
tags: [context, domain, authentication, workflows]
governance: context
code_refs:
  [
    apps/user-portal/src/app/sign-in/**,
    apps/user-portal/src/app/register/**,
    apps/user-portal/src/app/confirm-email/**,
    apps/user-portal/src/app/security/**,
    apps/user-portal/src/lib/registration.ts,
    apps/admin-portal/src/app/sign-in/**,
    packages/api-client/src/authentication/**,
    packages/api-react/src/authentication/**,
  ]
sources:
  - kind: file
    path: apps/user-portal/src/app/register/registration-form.tsx
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

The User Portal implements email/password sign-in, staged registration, email
confirmation and resend cooldown, password reset endpoints, password change, and
logout. Registration checks normalized email existence first, redirects existing
users to sign-in, gathers profile/country and password data, then routes
accepted registrations to confirmation. Confirmation posts through a same-origin
BFF, creates the cookie session on success, and redirects into the protected
app. Resend timing is based on backend `retryAtUtc` with a small clock-skew
allowance.

Sign-in and confirmation create sessions only through application BFF routes.
Logout clears local cookies even if backend logout is unavailable. Backend
validation is mapped onto known fields while unmapped messages remain
form-level.

Password and Google first factors can return `two_factor_required` instead of
an application session. Both converge on `/sign-in/two-factor`; the browser
sends only an authenticator or recovery code to the BFF, and only successful
verification starts normal authenticated navigation. The Security page owns
setup, enrollment, one-time recovery-code display, regeneration, and disable.
Sensitive setup and recovery results remain ephemeral UI state and are never
persisted.

The Security page also lists active sessions (`GET
/api/v1/authentication/sessions`) and paginated recent login activity (`GET
/api/v1/stakeholders/me/login-activity`, cursor-based via `useInfiniteQuery`),
both grouped under the `authentication` domain client and `api-react` module
alongside two-factor security rather than under `profiles`, since they are
security/session concerns despite the stakeholder-scoped login-activity route.
Revoking a session or signing out every other session
(`DELETE /api/v1/authentication/sessions/{sessionId}` and `.../sessions/others`)
invalidates the active-sessions query on success; no optimistic updates are
used. The current session (`isCurrent`) is always sorted first and is not
offered a revoke action here, since revoking it is equivalent to the existing
Logout flow and duplicating that cookie-clearing behavior was judged
unnecessary UX surface. All four operations are authenticated and are
BFF-routed like password/two-factor management: same-origin routes live under
`apps/user-portal/src/app/api/security/sessions/**` and
`.../api/security/login-activity/**`, and `apps/user-portal/src/lib/browser-api.ts`
rewrites the matching backend-shaped request paths to them.
Each login-activity row displays the backend-recorded IP address as a safely
encoded external lookup link and shows the backend-provided coarse location;
the frontend never performs IP geolocation.

The User Portal also has one GIS-based `Continue with Google` entry on sign-in
and registration. The backend selects immediate authentication, MFA
continuation, existing password-account linking, or profile-only Google
registration. A short-lived
HttpOnly BFF flow cookie carries the opaque continuation; every successful path
uses the normal application session cookies and validated post-authentication
destination. The browser creates that flow only after the customer explicitly
activates `Continue with Google`, so rendering an authentication page never
consumes the backend sign-in rate limit. Once the flow is ready, the portal
renders Google's official GIS button; it does not use the One Tap prompt as a
button substitute.

The Admin Portal implements sign-in and logout but adds an admission boundary:
the returned access token must contain the configured admin role. A rejected
session is best-effort logged out, cleared, and never stored. Role checks are
repeated during protected-route validation/refresh, but the backend remains
authoritative for every privileged operation.

Keep workflow schemas, copy, navigation, cooldown UI, conflict redirects, and
admission presentation in the owning app. Reusable backend operations and query
adapters remain in `api-client` and `api-react`.
