---
type: architecture
title: Application Ownership
description:
  Responsibilities and deliberate differences of the user, admin, and public
  portals
resource: okf://knowledge/architecture/application-ownership
tags: [constraint, architecture, applications, nextjs]
governance: constraint
code_refs: [apps/user-portal/**, apps/admin-portal/**, apps/public-portal/**]
sources:
  - kind: file
    path: apps/user-portal/src/app/layout.tsx
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

## Portal responsibilities

- **User Portal (`:9000`)** owns customer sign-in, registration, email
  confirmation, password/security, profile workflows, user navigation, user
  cookies, and customer-facing BFF routes.
- **Admin Portal (`:9001`)** owns administrator sign-in, admin role admission,
  admin cookies, privileged route protection, and admin navigation/composition.
  Backend authorization remains authoritative.
- **Public Portal (`:9002`)** owns marketing/legal pages, SEO metadata,
  sitemap/robots, site content configuration, and links into the User Portal. It
  does not share the authenticated dashboard shell.

Application-local schemas, messages, redirects, view models, notification
behavior, and providers stay with the application. Do not force the portals into
a shared application framework or share navigation simply because both dashboard
portals use `@template/dashboard-ui`.

BFF Route Handlers and session configuration are application boundaries: they
may call reusable API operations but own browser-facing route shape and cookie
policy.
