---
type: domain
title: Reference Data Domain
description: Country lookup as reusable API/query infrastructure and its current
  registration consumer
resource: okf://knowledge/domains/reference-data
tags: [context, domain, reference-data, countries]
governance: context
code_refs:
  [
    packages/api-client/src/reference-data/**,
    packages/api-react/src/reference-data/**,
    apps/user-portal/src/app/register/**,
  ]
sources:
  - kind: file
    path: packages/api-react/src/reference-data/reference-data.queries.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

Reference data currently consists of country lookup. The handwritten client owns
country wire contracts and the GET operation; `api-react` owns its stable key,
query options, and hook with shared cancellation/retry policy.

The User Portal registration flow consumes countries to populate its searchable
country field and owns loading/error UX and retry timing. The Admin Portal
contains navigation placeholders for future reference-data administration, but
no management workflow is implemented; do not document or centralize a
speculative CRUD architecture. Add new durable reference-data operations beside
countries when the backend contract exists, then add reusable queries only as
needed.
