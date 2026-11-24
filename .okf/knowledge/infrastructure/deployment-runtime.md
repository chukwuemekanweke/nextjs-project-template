---
type: infrastructure
title: Deployment and Runtime Shape
description:
  Independent Next.js standalone images, ports, health endpoints, production
  Compose stack, and build-time versus runtime configuration
resource: okf://knowledge/infrastructure/deployment-runtime
tags: [context, infrastructure, deployment, docker, nextjs]
governance: context
code_refs:
  [
    apps/*/Dockerfile,
    apps/*/next.config.ts,
    apps/*/.env.production,
    apps/*/src/app/api/health/route.ts,
    deploy/compose.production.yml,
    .dockerignore,
    turbo.json,
  ]
sources:
  - kind: file
    path: apps/user-portal/Dockerfile
  - kind: file
    path: deploy/compose.production.yml
  - kind: file
    path: docs/architecture/10-ci-cd-and-deployment.md
generated: { at: "2026-11-22T00:00:00Z", by: human }
status: stable
---

Each portal builds as a Next.js standalone application with a two-stage Node
22.23 Alpine image built from the repository root: `pnpm fetch`, offline frozen
install filtered to the portal and its workspace dependencies, `next build`;
the runner copies standalone output, `.next/static`, and `public/`, removes
package managers, and runs as non-root `node` with read-only app files.

- User Portal: port 9000, Admin Portal: 9001, Public Portal: 9002.
- `GET /api/health` (unauthenticated, no backend call, `no-store`) is the
  container and deployment health check; `/` redirects on user/admin portals.
- Browser `NEXT_PUBLIC_*` values compile in from `apps/<portal>/.env.production`;
  server values arrive at runtime from `deploy/compose.production.yml` and the
  host `stack.env`. All three Dockerfiles pass `.invalid` placeholder
  server values to the `next build` step only, because page-data collection
  loads `server-env.ts`.
- Production Compose runs the three portals as one stack: no image names (the
  deployer injects digests), read-only root, tmpfs `/tmp` and `.next/cache`,
  all capabilities dropped, loopback-only ports for the host reverse proxy.
- The stack's `web` network has a pinned subnet from `stack.env`
  (`PORTALS_SUBNET`/`PORTALS_GATEWAY`; distinct per stack on a host) so the
  API's reverse proxy can trust a stable range for forwarded browser IPs.
  Docker cannot change an existing network's IPAM: change it only under a new
  network name.

`next.config.ts` lists workspace packages that Next must transpile. Update it
when an app begins consuming another source-distributed package. Preserve
independent buildability when changing shared packages, environment contracts,
output paths, ports, or containers, and keep Compose ports, health checks, and
Dockerfile `PORT` values in agreement.
