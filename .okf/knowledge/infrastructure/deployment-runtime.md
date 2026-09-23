---
type: infrastructure
title: Deployment and Runtime Shape
description:
  Independent Next.js standalone builds, ports, containers, and CI build
  configuration
resource: okf://knowledge/infrastructure/deployment-runtime
tags: [context, infrastructure, deployment, docker, nextjs]
governance: context
code_refs:
  [
    apps/*/Dockerfile,
    apps/*/next.config.ts,
    .github/workflows/frontend-ci.yml,
    turbo.json,
  ]
sources:
  - kind: file
    path: apps/user-portal/Dockerfile
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

Each portal builds as a Next.js standalone application and has a multi-stage
Node 22.13 Alpine image. The builder installs the locked pnpm workspace and
builds only the target app; the non-root runtime copies standalone and static
output.

- User Portal: port 9000
- Admin Portal: port 9001
- Public Portal: port 9002

`next.config.ts` lists workspace packages that Next must transpile. Update it
when an app begins consuming another source-distributed package. Root Turbo
tasks express package-before-consumer dependencies and cache build output. CI
installs with the frozen lockfile, runs lint/typecheck/test, copies safe example
environments, then builds all apps. Preserve independent deployability when
changing shared packages, environment contracts, output paths, or containers.
