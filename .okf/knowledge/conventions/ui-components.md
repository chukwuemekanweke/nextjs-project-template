---
type: convention
title: Shared UI Component Conventions
description:
  How to use and extend the ui-core component foundation (variants, tokens,
  accessibility, server/client boundaries, compatibility APIs)
resource: okf://knowledge/conventions/ui-components
tags: [constraint, convention, ui, components, accessibility]
governance: constraint
code_refs:
  [
    packages/ui-core/src/components/**,
    packages/ui-core/src/lib/cn.ts,
    packages/forms/src/**,
    packages/dashboard-ui/src/charts/**,
    tooling/ui-workbench/**,
  ]
sources:
  - kind: file
    path: docs/design-system/shared-components.md
generated: { at: "2026-11-25T00:00:00Z", by: human }
status: stable
---

Compose screens from `@template/ui-core` components; do not hand-write
button, field, dialog, table, badge or loading/empty/error markup in apps. The
component list, variants and states are in
`docs/design-system/shared-components.md`.

- Styling: semantic token utilities only (no hex, no `dark:` colour pairs).
  Variants use `cva` beside the component; classes are merged with `cn()`
  from `ui-core` (tailwind-merge configured for the theme's custom names), and
  `className` is applied last so callers can override.
- Icons come from `ui-core` (curated Lucide, always `aria-hidden`, size
  presets `xs`–`lg`). Icon-only controls use `IconButton` with a `label`.
- Interactive behaviour uses Radix from `radix-ui` (Dialog, Tabs, Switch,
  ToggleGroup, Slot); prefer native checkbox, radio, select and inputs. No
  styled third-party component library, no shadcn CLI, no toast library.
- Keep static primitives free of `"use client"` and hooks; only components with
  state or browser APIs are client modules. `Button` stays server-renderable
  unless given `onClick` or `loading`.
- Accessibility contract: labels via `FormField`/`htmlFor`, hints and errors
  via `aria-describedby`, `aria-invalid` on invalid controls, error text plus
  icon (never colour alone), 44px controls, visible `:focus-visible`, dialogs
  labelled with focus trap/return, statuses carried by text.
- Business status → `BadgeTone`/alert variant mapping stays in apps.
  Components render supplied state and call supplied callbacks; they never
  fetch, retry, paginate or route by themselves.
- `buttonClassName`, `Modal`, `Pagination`, `StatusBadge`, `IconContainer`,
  `StatCard`, `SectionHeader`, `SettingsRow` are deprecated compatibility
  APIs backed by the new components; use the replacements in new code and do
  not delete them before FE-UI-032.
- `DataTable` defaults to horizontal scroll on phones; `mobileLayout="stack"`
  is opt-in per screen (billing history awaits OD-02).
- New or changed primitives need a workbench story, browser interaction tests
  (`*.browser.test.tsx`, `pnpm test:component`) and, for visual changes,
  reviewed baselines (`pnpm test:visual`). Workbench fixtures are generic and
  never simulate payments, identity, authentication or security outcomes.
