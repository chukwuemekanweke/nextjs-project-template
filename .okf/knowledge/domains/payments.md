---
type: domain
title: Payments Domain
description:
  Implemented wallet, top-up, payment initiation, and provider-activation API
  capabilities
resource: okf://knowledge/domains/payments
tags: [context, domain, payments, api]
governance: context
code_refs:
  [packages/api-client/src/payments/**, packages/api-react/src/payments/**]
sources:
  - kind: file
    path: packages/api-client/src/payments/operations.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

The payments package contract currently covers paginated wallet transactions,
lookup of a wallet top-up transaction, payment initiation, and payment-provider
activation. Contracts and operation metadata live together under
`api-client/src/payments`; path and query parameters are passed to the shared
transport rather than interpolated by features.

`api-react/src/payments` supplies payment keys, GET query options/hooks, and
mutation options with targeted invalidation. No complete application payment
screen/workflow is implemented yet. Do not describe one as existing or move
product decisions into packages. A future app owns amount-entry UX, redirects,
notifications, authorization presentation, and payment journey state while
reusing these package capabilities.
