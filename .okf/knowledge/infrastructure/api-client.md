---
type: infrastructure
title: Handwritten API Client
description:
  Contract grouping, operation structure, transport behavior, errors, and client
  extension rules
resource: okf://knowledge/infrastructure/api-client
tags: [constraint, infrastructure, api-client, http]
governance: constraint
code_refs: [packages/api-client/**, backendprojecttemplatewebapi.json]
sources:
  - kind: file
    path: packages/api-client/src/api-client.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

The shared API client is handwritten and independent of React. Do not introduce
Orval, NSwag TypeScript generation, generated DTO/operation directories,
regeneration commands, or generated contract-coverage tests.
`backendprojecttemplatewebapi.json` and the running API at
`http://localhost:8080/` are contract references; `sync:openapi` only refreshes
the checked-in document.

## Adding an operation

1. Put wire types and stable operation metadata in the relevant domain's
   `contracts.ts`.
2. Add the transport-based operation in `operations.ts` and expose it through
   that domain client and public index.
3. Add HTTP-boundary tests for paths, methods, path/query/body handling,
   headers, and response/error behavior.
4. Update related `api-react` integration separately when reusable React Query
   behavior is needed.

The transport owns absolute base URL validation, encoded path interpolation,
repeated query values, JSON and native `FormData` bodies, correlation IDs,
optional bearer tokens, cancellation/timeouts, response parsing, and normalized
`ApiError` values. Tenant headers are supplied by app client factories. Keep
contracts grouped by stable domain; only genuinely cross-domain types belong
under `shared`.

Features must not construct backend URLs, duplicate transport, or import package
internals. Use declared package/domain exports. Server and browser factories are
separate boundaries.
