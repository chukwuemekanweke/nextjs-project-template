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
generated: { at: "2026-11-26T00:00:00Z", by: human }
status: stable
---

The profiles domain exposes current-profile retrieval, profile update, and a
presigned avatar-upload lifecycle through the handwritten client. Authenticated
read (`GET /api/profile`, used by the dashboard shell's account identity),
update, and avatar create/complete operations use the User Portal's
same-origin profile BFF;
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

Screen composition (Trello FE-UI-007): `/profile` reads the profile on the
server and renders a Photo card (`AvatarUploadControl`) and a Personal
information form. `profile-update-submission.ts` (trim, mutate, map backend
errors) and `avatar-upload-guard.ts` (one upload at a time) keep the workflow
testable without a DOM; success is shown only after the mutation or upload
completion resolves. The upload has no byte progress, so its status is
indeterminate. Unsupported reference controls are never simulated: Remove is
disabled with an explanation; country, "last updated", connected Google
status and size/type limits are not shown (DR-019, DR-089). Account
verification (`isVerified`) is not identity verification (KYC). The overview
dashboard (`app/dashboard`) shows the same identity via `profileName`, so the
shell, dashboard and profile page stay consistent.
