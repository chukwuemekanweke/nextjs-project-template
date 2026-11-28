---
type: architecture
title: Design Tokens and Theming
description:
  Shared theme.css tokens, fonts, next-themes provider and controls, legacy
  compatibility layers, and rebranding rules
resource: okf://knowledge/architecture/design-tokens-theming
tags: [constraint, architecture, ui, design-system, tokens, theme, fonts]
governance: constraint
code_refs:
  [
    packages/ui-core/src/styles/**,
    packages/ui-core/src/theme/**,
    packages/dashboard-ui/src/tailadmin-theme.css,
    packages/dashboard-ui/src/components/theme-toggle.tsx,
    apps/*/src/app/globals.css,
    apps/*/src/app/layout.tsx,
    apps/*/src/components/app-providers.tsx,
    apps/public-portal/src/app/foundations/**,
  ]
sources:
  - kind: file
    path: packages/ui-core/src/styles/theme.css
  - kind: file
    path: docs/design-system/foundations.md
generated: { at: "2026-11-25T00:00:00Z", by: human }
status: stable
---

- `packages/ui-core/src/styles/theme.css` (export `@template/ui-core/theme.css`)
  is the single source of visual foundations. Every app's `globals.css` imports
  it right after `tailwindcss`. Palette values (`--palette-*`) are used only
  inside it; components use semantic utilities (`bg-surface`, `text-fg-muted`,
  `border-control-border`, `bg-brand hover:bg-brand-hover`, `text-h1`,
  `h-control`, `z-overlay`, `max-w-content`).
- Semantic colours are `--color-*` in `@theme static`, redefined under `.dark`;
  per-theme or responsive non-colour values (`--elevation-*`, `--type-*`,
  `--space-*`) are bound with `@theme inline`. Never pair `dark:` colour
  classes in new code, hard-code hex values, or add arbitrary z-index values.
  Tailwind's default breakpoints apply (phone < `md`, sidebar from `lg`).
- To add or change a token, edit `theme.css` (light value + `.dark` override,
  and, if paper content uses it, `.theme-light`) and `theme.test.ts`, which
  checks the pinned reference values, WCAG contrast and that each
  `.theme-light` value equals its light token. `class="theme-light"` keeps a
  subtree light inside a dark page (the billing document sheet); `dark:`
  variants still match inside it, so such content must not use them. Only
  pages containing `data-print-paper` print with a transparent body and a
  light `color-scheme`; other pages print unchanged. Form-control boundaries use `--color-control-border` (3:1), not
  the reference `--color-border-strong`.
- Rebrand by replacing `--palette-blue-*` (and optionally the neutral
  palettes) plus each app's `public/images` logo/favicon files and branding env.
  `NEXT_PUBLIC_BRAND_PRIMARY_COLOUR` is injected but read by nothing (the
  Solid `primary` went with FE-UI-005); its future is open decision OD-17.
- Fonts: each root layout loads Outfit (`--font-outfit-loaded`) and JetBrains
  Mono (`--font-jetbrains-mono-loaded`, `preload: false`) with
  `next/font/google`; `theme.css` maps them to `--font-sans` / `--font-mono`.
- Theme: one `ThemeProvider` from `@template/ui-core` per app, inside the app's
  `AppProviders` (class attribute, system default, storage key `theme`, per
  portal origin). Root layouts set `suppressHydrationWarning` on `<html>` only.
  Use `ThemeSwitch` / `ThemeSelect`; dashboard `ThemeToggle` wraps
  `ThemeSwitch`. Do not add another theme provider or read the theme during
  render without a hydration guard.
- Temporary layer: `@template/dashboard-ui/tailadmin-theme.css` (legacy
  `brand-*` → palette, slate `gray-*`, `shadow-theme-*`, `no-scrollbar`). Do
  not add new consumers; component tickets migrate them and FE-UI-032 deletes
  it. The public `globals.css` has no token layer of its own (Solid tokens
  removed in Trello FE-UI-005).
- `/foundations` in the public portal is a development-only specimen (404 in
  production); it must render real tokens, never redefine them.
