---
type: convention
title: API Contract Maintenance
description:
  How the checked-in OpenAPI reference and handwritten frontend contracts stay
  aligned
resource: okf://knowledge/conventions/api-contracts
tags: [constraint, convention, api, openapi, contracts]
governance: constraint
code_refs:
  [
    backendprojecttemplatewebapi.json,
    packages/api-client/src/**,
    packages/api-client/scripts/sync-openapi.mjs,
  ]
sources:
  - kind: file
    path: packages/api-client/scripts/sync-openapi.mjs
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

The checked-in `backendprojecttemplatewebapi.json` and the running Web API are
authoritative contract references, not code-generation input. The compatible
backend lives at `C:\Work\Chidelu\BackendProjectTemplate`; local OpenAPI
defaults to `http://localhost:8080/openapi/v1.json`.

`pnpm sync:openapi` downloads and validates that reference only. It must not
generate TypeScript. For a contract change, inspect the OpenAPI/backend, then
update together:

- domain-grouped wire types and operation metadata;
- the handwritten operation and domain client;
- public exports when needed;
- HTTP-boundary tests;
- reusable `api-react` integration when applicable.

Keep casing and field shapes faithful at the wire boundary. Keep only genuinely
shared types under `shared`. Do not create generated directories, whole-API
declarations, automatic DTO/endpoint generation, or generated coverage tests.
