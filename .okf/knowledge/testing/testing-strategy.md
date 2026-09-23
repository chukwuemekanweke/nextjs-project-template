---
type: testing
title: Testing Strategy
description:
  Current Vitest coverage boundaries and expectations for infrastructure and
  application behavior
resource: okf://knowledge/testing/testing-strategy
tags: [context, testing, vitest, boundaries]
governance: context
code_refs:
  [
    apps/**/*.test.ts,
    apps/**/*.test.tsx,
    packages/**/*.test.ts,
    packages/**/*.test.tsx,
  ]
sources:
  - kind: file
    path: packages/api-client/src/client/request.test.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

Vitest tests are colocated with implementation. Current coverage focuses on
durable boundaries and pure behavior rather than broad browser rendering:

- `api-client`: HTTP request/response/error semantics, operation metadata,
  export safety, browser refresh coordination, BFF fetch behavior, and
  route-session helpers.
- `api-react`: key/options/hook policies and integration with domain clients.
- `forms`: backend validation mapping.
- `config`: schema validation and defaults.
- applications: session/cookie adapters, sign-in/logout, authorization,
  registration/profile/password helpers, navigation, environment, and portal
  configuration.

When changing transport, auth concurrency, serialization, package exports, BFF
routing, or validation mapping, add boundary-focused regression tests. Prefer
injected fetch/clock/location/client dependencies and deterministic unit tests.
Run a filtered workspace test while iterating, then the repository test suite;
architectural/shared changes also require the full verification sequence.
