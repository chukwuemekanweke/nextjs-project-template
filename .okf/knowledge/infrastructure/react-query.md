---
type: infrastructure
title: TanStack Query Integration
description:
  Ownership of reusable query keys, options, hooks, retries, cancellation, and
  invalidation
resource: okf://knowledge/infrastructure/react-query
tags: [constraint, infrastructure, react-query, caching]
governance: constraint
code_refs: [packages/api-react/**]
sources:
  - kind: file
    path: packages/api-react/src/query-client/create-query-client.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

`packages/api-react` adapts `api-client` domain clients to TanStack Query. It
owns stable keys, query/mutation options, reusable hooks, query-client defaults,
retry policy, and reusable invalidation.

- Queries forward TanStack's `AbortSignal` to API operations.
- Retryable query options are restricted to declared GET operations. Queries
  retry at most twice with exponential delay, and do not retry cancellations or
  API failures below 500.
- Mutations do not retry by default. Domain mutation options may invalidate or
  clear well-defined shared caches (for example profile updates and logout).
- `ApiProvider` supplies the API client and query client to applications.

This package must not own backend URLs, HTTP/error transport, cookies/tokens,
navigation, toasts, forms, app redirects, application view models, or
feature-specific UX. Those are owned by `api-client` or the composing
application. Add a reusable mutation here; keep its submit workflow and
success/error presentation in the app.
