---
type: domain
title: Profiles Domain
description: Current profile retrieval, editing, presigned avatar upload, BFF use, and cache behavior
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
    apps/user-portal/src/lib/avatar-upload.ts,
  ]
sources:
  - kind: file
    path: apps/user-portal/src/lib/avatar-upload.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

The profiles domain exposes current-profile retrieval, profile update, and a
presigned avatar-upload lifecycle through the handwritten client. Authenticated
create and complete operations use the User Portal's same-origin profile BFF;
the BFF never receives file bytes. The application uploads the selected `File`
directly to the returned object-storage URL using the server-provided method and
headers with browser credentials omitted, then completes the upload only after a
successful storage response.

`api-react` owns the current-profile key/query and update/create/complete mutation
options. Query cancellation reaches the HTTP request; successful update and
avatar-completion mutations invalidate the current profile. The User Portal owns
the direct-upload sequence, display formatting, edit schema, form aliases/messages,
workflow UI, and server-component refresh. Browser code must not add application
authentication, tenant, correlation, cookie, or session headers to the signed
object-storage request.
