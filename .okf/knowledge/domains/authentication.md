---
type: domain
title: Authentication Product Workflows
description:
  Implemented customer and administrator authentication flows above session
  infrastructure
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

The User Portal also has one GIS-based `Continue with Google` entry on sign-in
and registration. The backend selects immediate authentication, existing
password-account linking, or profile-only Google registration. A short-lived
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
