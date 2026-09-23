---
type: architecture
title: Monorepo Boundaries
description:
  Ownership split between independently deployable applications and reusable
  workspace packages
resource: okf://knowledge/architecture/monorepo-boundaries
tags: [constraint, architecture, monorepo, ownership]
governance: constraint
code_refs: [apps/**, packages/**, pnpm-workspace.yaml, turbo.json]
sources:
  - kind: file
    path: pnpm-workspace.yaml
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

## Boundary

- `apps/user-portal`, `apps/admin-portal`, and `apps/public-portal` are separate
  Next.js applications with their own routes, configuration, composition, and
  Docker image.
- `apps/*` owns product behavior: pages, route composition, navigation, copy,
  redirects, notifications, BFF Route Handlers, session policy, and feature
  workflows.
- `packages/*` owns reusable infrastructure, configuration schemas, API
  integration, form primitives, and presentation primitives. A package must not
  become a hidden home for one application's workflow.
- Share a capability only when its contract is genuinely reusable.
  Similar-looking application code may remain separate when its policy, copy,
  routing, or lifecycle differs.

The root pnpm workspace and Turbo tasks coordinate builds and checks; they do
not merge application ownership. Each app must remain independently buildable
and deployable.
