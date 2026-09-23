---
type: domain
title: Providers Domain
description: Implemented active-provider mutation and its reusable query adapter boundary
resource: okf://knowledge/domains/providers
tags: [context, domain, providers, api]
governance: context
code_refs:
  [packages/api-client/src/providers/**, packages/api-react/src/providers/**]
sources:
  - kind: file
    path: packages/api-client/src/providers/operations.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

The providers domain currently exposes the backend operation for selecting an
active provider, with its request/response contract and metadata grouped under
`packages/api-client/src/providers`. `packages/api-react/src/providers` exposes
the reusable mutation adapter.

There is no implemented provider-management application workflow. Keep backend
operation details in `api-client`, reusable mutation mechanics in `api-react`,
and any future selection UI, messages, navigation, authorization presentation,
and product workflow in the owning application.
