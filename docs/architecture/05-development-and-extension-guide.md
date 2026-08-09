# Development and extension guide

This guide applies the boundaries described in [Monorepo foundation](./01-monorepo-foundation.md), [Application architecture](./02-application-architecture.md), [Shared dashboard architecture](./03-shared-dashboard-architecture.md), and [Public portal architecture](./04-public-portal-architecture.md).

## Where to change what

| Change                                                                            | Home                                                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| User Portal navigation, labels, profile actions, page composition                 | `apps/user-portal/src/config/navigation.ts`, `src/components/user-layout-shell.tsx`, and App Router routes   |
| Admin Portal navigation, labels, profile actions, page composition                | `apps/admin-portal/src/config/navigation.ts`, `src/components/admin-layout-shell.tsx`, and App Router routes |
| Reusable cards, inputs, tables, pagination, modal, loading state                  | `packages/ui-core/src`                                                                                       |
| Reusable dashboard layout, sidebar/nav rendering, breadcrumb/profile presentation | `packages/dashboard-ui/src`                                                                                  |
| Shared public section rendering and public content types                          | `packages/public-ui/src`                                                                                     |
| Public copy, navigation, CTAs, branding/contact values, page assembly             | `apps/public-portal/src/config/site.ts` and its `src/app` routes                                             |
| Handwritten backend contracts, transport, errors, and resource operations         | `packages/api-client/src`                                                                                    |
| Reusable TanStack Query keys, options, invalidation, providers, and hooks         | `packages/api-react/src`                                                                                     |
| Reusable React Hook Form/Zod composition and backend field-error mapping          | `packages/forms/src`                                                                                         |
| Portal session cookies and same-origin authentication endpoints                   | matching dashboard app's `src/app/api/auth` and `src/lib/server-api.ts`                                      |
| Shared TypeScript and ESLint policy                                               | `packages/typescript-config`, `packages/eslint-config`                                                       |
| Application variables                                                             | the matching `apps/<app>/.env.example` and `src/config/env.ts`                                               |

## Add a dashboard route

For User Portal, create a route such as `apps/user-portal/src/app/profile/page.tsx`; then add `{ label: "Profile", href: "/profile" }` to `userNavigation` if it is not already present. The shell automatically passes the pathname to the shared sidebar and computes its final breadcrumb label from that same configuration. Create the equivalent file and update `adminNavigation` for an Admin Portal route. Keep the page's product-specific data composition in the app; import reusable display pieces through `@template/ui-core` or `@template/dashboard-ui`.

The current navigation configs already advertise several destinations for which no `page.tsx` exists. Add the route before considering the link implemented.

## Choose the correct home

Put a component in an **app** when it contains product wording, a route destination, app-only configuration, identity/permission meaning, or a specific workflow. Put it in **ui-core** when it is a domain-neutral primitive that can render without dashboard navigation. Put it in **dashboard-ui** when it is a reusable dashboard frame or navigation presentation that accepts app-provided slots/data. Put it in **public-ui** when it is a reusable public-site section that consumes typed marketing content.

`@/` is a local alias: in `apps/user-portal`, `@/lib/portal` means `apps/user-portal/src/lib/portal`. `@template/*` is a workspace package import resolved by pnpm and exposed from the package’s root barrel, for example `@template/dashboard-ui`. Do not replace the latter with cross-application relative imports.

## Mistakes to avoid

- Do not add User or Admin navigation arrays to `dashboard-ui`; pass them into `DashboardSidebarNav` and `MobileNav`.
- Do not import public-ui or its marketing dependencies into dashboard apps.
- Do not import a dashboard package into Public Portal simply to reuse a generic element; use or extend the appropriate shared boundary deliberately.
- Do not omit `transpilePackages` or a Tailwind `@source` path when an app consumes new TypeScript/CSS-bearing shared source.
- Do not use `NEXT_PUBLIC_` for secrets, or make browser-visible configuration a substitute for server-side validation.
- Do not remove `LICENSE.tailadmin` or `LICENSE.solid` files when moving derived assets or components.
- Do not mistake placeholder UI and navigation for implemented API, authorization, or business behaviour.

## Current architecture versus future work

Implemented now: pnpm/Turbo workspace orchestration; strict shared TypeScript/ESLint; three standalone Next applications; TailAdmin-derived dashboard primitives and shell; Solid-derived typed public sections; application-owned navigation, configuration, metadata, static assets, and containers; a handwritten, strongly typed API package; centralized TanStack Query providers and policy; reusable React Hook Form/Zod composition; and separate User/Admin credential sign-in flows whose same-origin endpoints keep backend tokens in secure HttpOnly cookies.

Future or deliberately absent: authenticated-route enforcement, refresh coordination, logout UI, permission-based controls, application-specific query and form workflows beyond sign-in, domain workflows for accounts/admin operations, checkout/contact processing, and observability. Shared query and form infrastructure is not evidence that these product workflows or screens exist. The dashboard pages' empty tables and the Public Portal's marketing/legal content remain extension points.

## Validate a change

Run the root commands appropriate to the change:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm --filter @template/<application> <task>` for a focused application check. A full build is especially useful after changing a workspace package, application Next configuration, Tailwind sources, or container assumptions.

## Git and pull-request workflow

`scripts/git-workflow.ps1` owns the repository's optional Windows PowerShell
workflow automation. Its `start` command fast-forwards local `main` from
`origin/main` and creates branches named
`epic-{number}/fe-{number}-{kebab-case-label}`. It refuses to start from a dirty
working tree or overwrite an existing local or remote branch.

Developers stage their intended files explicitly. The `publish` command runs the
root lint, type-check, and test tasks before invoking Codex in a read-only,
non-interactive session. Codex returns a schema-constrained commit subject, PR
title, and PR body based on the staged diff, repository instructions, and
`.github/pull_request_template.md`. Human approval remains required before the
commit and before `gh pr create`; the AI session itself cannot edit, commit,
push, or create the PR. Draft PRs are the default.

On Windows, the script discovers a Codex executable with its matching sandbox
helper and adds that directory to the nested process path. This allows it to use
the Codex version bundled with the VS Code extension when another installation
is missing the Windows helper, while keeping metadata inspection read-only.

The workflow uses the `chukwuemekanweke` GitHub account for this repository. Git
pushes go through the `github-chukwuemekanweke` SSH host alias. GitHub API calls
use a PAT saved by the one-time `setup-auth` command. PowerShell stores the
credential under `%LOCALAPPDATA%\FrontendProjectTemplate` with Windows
user-and-machine encryption, and the script verifies that the token belongs to
the expected account before it continues. A process-level
`CHUKWUEMEKANWEKE_GITHUB_TOKEN` can override the saved credential. The workflow
does not switch or fall back to the globally active `gh` account.

`publish` also supports recovery after a partial run. When there are no staged
changes but the feature branch contains commits ahead of `origin/main`, it
regenerates the PR metadata from the committed branch diff and resumes the push
and PR-creation steps without creating another commit.

After GitHub confirms that the branch PR is merged, `finish` switches to `main`,
fetches and prunes remote references, and pulls with `--ff-only`. It deliberately
keeps the merged local feature branch. This makes branch deletion a separate,
explicit developer choice rather than an automated side effect.
