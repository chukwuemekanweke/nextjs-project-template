---
type: workflow
title: Repository Verification
description: Required repository checks and when filtered checks are insufficient
resource: okf://knowledge/workflows/verification
tags: [constraint, workflow, verification, pnpm, turbo]
governance: constraint
code_refs: [package.json, turbo.json, .github/workflows/frontend-ci.yml]
sources:
  - kind: file
    path: package.json
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

Run repository verification in this order:

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

Turbo runs workspace tasks with dependency ordering. During development,
`pnpm --filter <workspace> <task>` is appropriate for fast feedback. Changes to
shared packages, root tooling, application boundaries, deployment, or
repository-wide architecture must finish with the complete root sequence. Builds
require valid environment values; CI copies each app's safe `.env.example` to
`.env.local` before `pnpm build`.
