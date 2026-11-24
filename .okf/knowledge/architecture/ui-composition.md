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
    apps/*/src/app/layout.tsx,
    packages/ui-core/**,
    packages/dashboard-ui/**,
    apps/*/src/app/globals.css,
    apps/*/src/components/*-layout-shell.tsx,
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
  controls, modals, pagination, skeletons, tables, and accessible tabs; the
  outlined icon set (`icons.tsx`); `buttonClassName` variants (primary,
  secondary, accent, destructive, danger); settings primitives
  (`SectionHeader`, `SettingsRow`, `StatusBadge`, `IconContainer`,
  `EmptyState`); and the presentation-only `formatMinorUnits` money formatter
  (also used by the Public Portal).
- `@template/dashboard-ui` (depends on `ui-core`) exposes reusable dashboard
  layout mechanics: shell, sidebar state and rendering (expanded 224px /
  collapsed 72px rail with tooltips / mobile drawer), `DashboardBrand`, header
  controls (`MobileNav`, `ThemeToggle`), breadcrumbs, the page header
  (`DashboardHeader`, optional icon tile), and profile-menu presentation. Apps
  supply items, nav icons, destinations, identity text, actions, and
  authorization-aware composition.
- Dashboard pages start with `DashboardHeader` on the page background, then
  cards built from `Card` + `SectionHeader` + bordered `SettingsRow`s. Feature
  compositions (for example the Security cards) stay in the app.
- Colours come only from semantic tokens in
  `packages/dashboard-ui/src/tailadmin-theme.css`: `brand-*` (primary blue,
  500/600/700 = default/hover/pressed) and slate `gray-*`; status uses
  Tailwind green/red/amber. Rebrand by replacing the `brand-*` scale; do not
  hardcode hex colours or reintroduce purple/indigo accents in components.
  Every component pairs light classes with `dark:` variants (`.dark` on
  `<html>`, slate 950 background / 900 surfaces).
- App `globals.css` resets must stay inside `@layer base`; unlayered rules
  override Tailwind utilities (an unlayered `a { color: inherit }` broke link
  colours).
- `@template/public-ui` exposes marketing sections and typed content inputs. The
  Public Portal owns concrete copy, navigation, URLs, metadata, and page
  assembly.
- Fonts are loaded only in app root layouts with `next/font/google`
  (self-hosted at build): dashboards set `--font-outfit-loaded`, which the
  shared theme's `--font-outfit` uses; the Public Portal sets
  `--font-inter-loaded`. Do not add font CDN links or `@font-face` rules.
- Application layouts and components decide which primitives to compose. Do not
  move navigation, business state, routes, toasts, or product workflows into
  shared UI packages.

Keep existing package-level TailAdmin/Solid notices when adapting or
distributing derived UI. Do not add repetitive source banners when the package
notice satisfies the license.
