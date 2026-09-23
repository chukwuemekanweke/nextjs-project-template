---
type: workflow
title: Keeping OKF Current
description:
  Mandatory check after architecture, application, package, build, test,
  deployment, or PR workflow changes
resource: okf://knowledge/workflows/okf-maintenance
tags: [constraint, workflow, okf, knowledge-maintenance]
governance: constraint
code_refs:
  [
    .okf/knowledge/**,
    apps/**,
    packages/**,
    package.json,
    turbo.json,
    .github/**,
    scripts/**,
  ]
sources:
  - kind: file
    path: AGENTS.md
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

## Mandatory done step

Whenever code under `apps/` or `packages/`, or build/testing/deployment/PR
workflow configuration, materially changes:

1. Query OKF for the affected concern and inspect concepts whose `code_refs`
   overlap the changed paths.
2. Update a covering concept when a claim, responsibility, constraint, extension
   point, or referenced path is now stale, incomplete, or incorrect.
3. Add a focused concept when the change introduces a durable architectural
   concern not covered elsewhere. Use the existing frontmatter shape, narrow
   `code_refs`, `governance: constraint|context`, and current source paths.
4. If the implementation follows existing knowledge and adds no durable
   information, record that no OKF edit is required - but only after the check.
5. Run `okf lint -strict` before finishing.

Check changes to package ownership/dependencies, app boundaries, API/query/form
behavior, auth/session concurrency, route protection, server/browser boundaries,
environment configuration, UI ownership, tests, deployment/runtime, and
developer workflow. Do not update OKF for incidental implementation details
unlikely to guide a future agent.

Source is authoritative. Keep concepts small and retrieval-oriented; edit an
existing concept instead of duplicating it. Do not regenerate OKF from
`docs/architecture/`, re-run `okf init`, or install an automatic OKF git hook.
Human docs remain detailed and should be updated separately when architecture
changes make them inaccurate.
