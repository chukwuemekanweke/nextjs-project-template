---
type: architecture
title: Package Dependency Rules
description:
  Allowed dependency direction among API, query, forms, UI, configuration, and
  applications
resource: okf://knowledge/architecture/package-dependency-rules
tags: [constraint, architecture, packages, dependencies]
governance: constraint
code_refs: [packages/**/package.json, apps/**/package.json]
sources:
  - kind: file
    path: packages/api-react/package.json
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

`apps/*` may compose `api-react`, `api-client`, `forms`, UI packages, and
`config`. `api-react` depends on `api-client`; `forms` depends on `api-client`
only for normalized errors and on `ui-core` for controls. `api-client` has no
React or TanStack Query dependency.

## Rules

- Reusable backend contracts, operation metadata, operations, and transport
  belong in `packages/api-client`.
- Reusable TanStack Query keys, options, hooks, cache/retry policy, and
  invalidation belong in `packages/api-react`.
- Domain-neutral React Hook Form/Zod integration and accessible fields belong in
  `packages/forms`.
- `ui-core` is general UI; `dashboard-ui` is dashboard-shell UI; `public-ui` is
  marketing UI. None owns application navigation or business workflows.
- `config` owns reusable validation/building blocks, while each app reads and
  extends its own environment.
- Consumers import declared package exports, never `packages/*/src` internals.
- Keep build-only standards in `eslint-config` and `typescript-config`; runtime
  packages must not depend on them.
