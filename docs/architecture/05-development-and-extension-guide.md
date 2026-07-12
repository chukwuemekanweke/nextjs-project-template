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

Implemented now: pnpm/Turbo workspace orchestration; strict shared TypeScript/ESLint; three standalone Next applications; TailAdmin-derived dashboard primitives and shell; Solid-derived typed public sections; application-owned navigation, configuration, metadata, static assets, and containers; and small configuration/navigation-focused Vitest tests.

Future or deliberately absent: shared configuration validation, the reserved generated API client, API calls/query cache, form state and submission infrastructure, authentication/session handling, backend authorization enforcement in the frontend, domain workflows for accounts/admin operations, checkout/contact processing, and observability. The dashboard pages’ empty tables and the Public Portal’s marketing/legal content are extension points, not evidence that those capabilities exist.

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
