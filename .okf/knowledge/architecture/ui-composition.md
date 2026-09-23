---
type: architecture
title: UI Composition and Package Ownership
description:
  Responsibilities of ui-core, dashboard-ui, public-ui, and application
  composition
resource: okf://knowledge/architecture/ui-composition
tags: [constraint, architecture, ui, composition]
governance: constraint
code_refs:
  [
    packages/ui-core/**,
    packages/dashboard-ui/**,
    packages/public-ui/**,
    apps/*/src/app/**,
    apps/*/src/components/**,
  ]
sources:
  - kind: file
    path: packages/dashboard-ui/src/components/dashboard-shell.tsx
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

- `@template/ui-core` exposes general controls such as alerts, cards, form
  controls, modals, pagination, skeletons, and tables.
- `@template/dashboard-ui` exposes reusable dashboard layout mechanics: shell,
  sidebar state and rendering, mobile navigation, breadcrumbs, header, and
  profile-menu presentation. Apps supply items, destinations, identity text,
  actions, and authorization-aware composition.
- `@template/public-ui` exposes marketing sections and typed content inputs. The
  Public Portal owns concrete copy, navigation, URLs, metadata, and page
  assembly.
- Application layouts and components decide which primitives to compose. Do not
  move navigation, business state, routes, toasts, or product workflows into
  shared UI packages.

Keep existing package-level TailAdmin/Solid notices when adapting or
distributing derived UI. Do not add repetitive source banners when the package
notice satisfies the license.
