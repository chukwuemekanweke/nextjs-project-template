---
type: infrastructure
title: CI/CD Pipeline Ownership
description:
  Thin devops-toolkit workflow callers, pinned toolkit revision, release
  configuration files, and what this repository must not reimplement
resource: okf://knowledge/infrastructure/ci-cd-pipeline
tags: [constraint, infrastructure, ci, cd, github-actions, devops-toolkit]
governance: constraint
code_refs:
  [
    .github/workflows/frontend-ci.yml,
    .github/docker-images.json,
    .github/vps-deploy.production.json,
    deploy/**,
  ]
sources:
  - kind: file
    path: .github/workflows/frontend-ci.yml
  - kind: file
    path: docs/architecture/10-ci-cd-and-deployment.md
generated: { at: "2026-11-22T00:00:00Z", by: human }
status: stable
---

`.github/workflows/frontend-ci.yml` only calls devops-toolkit reusable
workflows: `nextjs-ci.yml` and `release-config-check.yml` on every event, then
`docker-publish.yml` and `vps-deploy.yml` on push to `main`, plus a caller-owned
failure notification job. There are two deploy targets, `development` (SSH port 35340) and `production`, each gated by a repository variable
(`DEVELOPMENT_DEPLOY_ENABLED` / `PRODUCTION_DEPLOY_ENABLED` = `true`) and each
with its own release-config check.

- Do not add install, build, scan, publish, manifest, or deploy steps to the
  caller or to local scripts. Missing capability is a generic toolkit
  enhancement, never an app-specific workaround.
- Pin every toolkit call to the same reviewed full SHA (or later an immutable
  release tag); never `@main` or feature branches. Upgrade all of them together.
- Jobs declare `contents: read`; workflow default `permissions: {}`; map
  secrets explicitly, never `secrets: inherit`. Only trusted `main` pushes
  publish or deploy. Deploy credentials are GitHub Environment secrets (the
  toolkit deploy job runs in the Environment); publish credentials are
  repository secrets.
- Application-owned release configuration: `.github/docker-images.json`
  (component = Compose service = portal name), `.github/vps-deploy.production.json`,
  `.github/vps-deploy.development.json`, `deploy/compose.production.yml` (shared
  by both targets), `deploy/stack.env.example` and
  `deploy/stack.development.env.example` (non-secret host stand-ins), and
  `deploy/vps-deploy-stack.{production,development}.json` (must mirror each
  host registry). `check-release-config` validates all of them on PRs.
- The three portals deploy as one stack; restoration is stack-wide. Per-portal
  stacks need a toolkit enhancement (manifest components must all be services).
- Server-only secrets never go in `NEXT_PUBLIC_*`, build args, `.env.production`,
  Compose, or `stack.env`; use toolkit DEVOPS-007 runtime-secret mounts.
