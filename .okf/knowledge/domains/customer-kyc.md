---
type: domain
title: Customer KYC Frontend Integration
description: Backend-authoritative KYCAid customer lifecycle, BFF boundary, polling and provider return
resource: okf://knowledge/domains/customer-kyc
tags: [constraint, domain, kyc, kycaid, user-portal]
governance: constraint
code_refs:
  - packages/api-client/src/kyc/**
  - packages/api-react/src/kyc/**
  - apps/user-portal/src/app/api/kyc/**
  - apps/user-portal/src/app/verification/**
  - apps/user-portal/src/features/verification/**
  - apps/user-portal/src/lib/browser-api.ts
sources:
  - kind: file
    path: docs/architecture/customer-kyc-integration.md
generated: { at: "2026-11-28T00:00:00Z", by: agent }
status: stable
---

Customer KYC uses the handwritten `api-client` domain, the shared
`['kyc', 'current']` React Query key, and authenticated same-origin User Portal
BFF routes. The browser never receives an access token or accepts stakeholder
identity; the backend derives stakeholder and tenant ownership from the active
session and forwarded `X-Tenant-Id` context.

`GET /api/v1/stakeholders/me/kyc` is authoritative. Poll only backend
`Pending`/`InProgress`, with the local count bound in `kyc.queries.ts`; stop on
terminal/unknown state, read error, unmount or session failure, and offer manual
refresh after exhaustion. The start mutation calls only `POST
/api/v1/stakeholders/me/kyc/start` for start, resume and restart and invalidates
the current key even after ambiguous failure.

The presentation adapter maps backend `Pending` to continuation/preparation and
backend `InProgress` to provider review. `isVerified` is the success authority;
unknown future statuses expose no action. Only Rejected, Failed and Expired
restart. Navigate only to the backend-returned HTTPS URL. A provider return to
authenticated `/verification`, query parameters or form completion never prove
success.

Every backend environment owns `Kyc:Kycaid:RedirectUrl` and must point it at its
public `/verification` URL. Customer history and stable KYC error codes are not
currently exposed. See `docs/architecture/customer-kyc-integration.md` for the
detailed lifecycle, status errors and deployment requirements.
