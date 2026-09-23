---
type: domain
title: Profiles Domain
description: Current profile retrieval, editing, avatar upload, BFF use, and cache behavior
resource: okf://knowledge/domains/profiles
tags: [context, domain, profiles, api]
governance: context
code_refs:
  [
    packages/api-client/src/profiles/**,
    packages/api-react/src/profiles/**,
    apps/user-portal/src/app/profile/**,
    apps/user-portal/src/app/api/profile/**,
    apps/user-portal/src/lib/profile-*.ts,
  ]
sources:
  - kind: file
    path: packages/api-client/src/profiles/operations.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

The profiles domain exposes current-profile retrieval, profile update, and
multipart avatar upload through the handwritten client. Upload builds native
`FormData` using backend field name `Avatar`; the transport must not set a JSON
content type for it.

`api-react` owns the current-profile key/query and update/avatar mutation
options. Query cancellation reaches the HTTP request; successful mutations
invalidate the current profile. The User Portal owns display formatting, edit
schema, form aliases/messages, and workflow UI. Authenticated browser profile
updates are routed through the same-origin `/api/profile` BFF so bearer tokens
remain server-side. Add reusable profile API behavior to the packages, but keep
screen/view behavior in the app.
