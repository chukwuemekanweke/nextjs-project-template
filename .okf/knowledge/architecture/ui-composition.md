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
    packages/dashboard-ui/src/charts/**,
    apps/*/src/app/**,
    apps/*/src/components/**,
  ]
sources:
  - kind: file
    path: packages/dashboard-ui/src/components/dashboard-shell.tsx
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

- `@template/ui-core` exposes the design-system component foundation (see
  `ui-components` and `docs/design-system/shared-components.md`): `cn`,
  curated Lucide icons, actions, indicators, surfaces, native-first form
  controls, Radix `Dialog`/`ConfirmDialog`/`Tabs`/`Switch`/
  `SegmentedControl`, `DataTable`, `Pager`, `Alert`, skeletons and
  empty/error states; deprecated compatibility APIs (`buttonClassName`,
  `Modal`, `Pagination`, `StatusBadge`, `IconContainer`, `StatCard`,
  `SectionHeader`, `SettingsRow`); the presentation-only `formatMinorUnits`
  money formatter (also used by the Public Portal); and the shared theme
  (`theme.css`, `ThemeProvider`, `ThemeSwitch`, `ThemeSelect`).
- `@template/dashboard-ui` (depends on `ui-core`) exposes reusable dashboard
  layout mechanics: shell, sidebar state and rendering (expanded 224px /
  collapsed 72px rail with tooltips / mobile drawer), `DashboardBrand`, header
  controls (`MobileNav`, `ThemeToggle` = shared `ThemeSwitch`), breadcrumbs, the page header
  (`DashboardHeader`, optional icon tile), and profile-menu presentation. Apps
  supply items, nav icons, destinations, identity text, actions, and
  authorization-aware composition. `@template/dashboard-ui/charts` holds
  chart foundations (`ChartFrame`, `ChartLegend`, series colour helpers);
  Recharts is deferred (TD-10).
- Dashboard pages start with `DashboardHeader` on the page background, then
  cards. New work uses `Card` + `CardHeader` + `ListRow`/`KeyValueList`;
  existing pages still use `SectionHeader` + `SettingsRow`. Feature
  compositions (for example the Security cards) stay in the app.
- Visual foundations (semantic colour tokens, type scale, sizes, radius,
  elevation, layers, theme provider and controls) come from
  `@template/ui-core`; see `design-tokens-theming`. New or modified
  components use semantic utilities (`bg-surface`, `text-fg-muted`,
  `bg-brand`, `bg-success-bg text-success`) without `dark:` colour pairs or
  hex values; shared packages already do. Un-migrated app screens still use
  the legacy `brand-*`/slate `gray-*` + `dark:` pairs from the temporary
  `@template/dashboard-ui/tailadmin-theme.css` until their migration ticket.
- App `globals.css` resets must stay inside `@layer base`; unlayered rules
  override Tailwind utilities (an unlayered `a { color: inherit }` broke link
  colours).
- `@template/public-ui` exposes marketing sections and typed content inputs. The
  Public Portal owns concrete copy, navigation, URLs, metadata, and page
  assembly.
- Fonts are loaded only in app root layouts with `next/font/google`
  (self-hosted at build): every app sets `--font-outfit-loaded` (Outfit) and
  `--font-jetbrains-mono-loaded` (JetBrains Mono), which `theme.css` maps to
  `--font-sans` / `--font-mono`. Do not add font CDN links or `@font-face`
  rules.
- Application layouts and components decide which primitives to compose. Do not
  move navigation, business state, routes, toasts, or product workflows into
  shared UI packages.

This describes the current implementation. A design-first redesign is planned
(`design-system-integration`); its tickets update this concept as they land.

Keep existing package-level TailAdmin/Solid notices when adapting or
distributing derived UI. Do not add repetitive source banners when the package
notice satisfies the license.
