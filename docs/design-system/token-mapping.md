# Token mapping

Reference token values (pinned commit `d23eb85`) compared with today's tokens, and the semantic token set proposed for `@template/ui-core/theme.css` (decision TD-02). Reference values come from the `.tp` (light) and `.tp.dark` (dark) custom properties inlined, byte-identically, in all 307 canonical files; `0-foundations/Main.html` shows the same values as swatches.

Current sources:

- Dashboards: `packages/dashboard-ui/src/tailadmin-theme.css` (`brand-*`, slate `gray-*`, `shadow-theme-*`, breakpoints, `z-index-*`; status uses raw Tailwind `green/emerald/red/amber/blue`).
- Public Portal: Solid `@theme` in `apps/public-portal/src/app/globals.css` (`primary` = `var(--brand-primary, #006bff)`, `stroke`, `blacksection`, `waterloo`, …) — removed entirely by the migration.

## 1. Naming

Semantic tokens are CSS custom properties defined on `:root` (light) and redefined on `.dark`. They are bound to Tailwind with `@theme inline`, giving utilities such as `bg-surface`, `text-fg-muted`, `border-border-strong`, `bg-brand`, `text-brand-ink`, `bg-success-bg`. Components use only semantic tokens; palette values are referenced only inside `theme.css`.

## 2. Colour

| Semantic token            | Reference light                            | Reference dark                             | Reference name              | Closest current token                           | Change                                                                 |
| ------------------------- | ------------------------------------------ | ------------------------------------------ | --------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| `--color-bg`              | `#F5F7FB`                                  | `#0F0F11`                                  | `--bg`                      | `gray-50` `#f8fafc` / dark `gray-950` `#0b1120` | Light differs slightly; dark changes from blue-black slate to neutral. |
| `--color-surface`         | `#FFFFFF`                                  | `#18181B`                                  | `--surface`                 | `white` / dark `gray-900` `#0f172a`             | Dark becomes neutral zinc.                                             |
| `--color-surface-2`       | `#F8FAFC`                                  | `#1C1C20`                                  | `--surface-2`               | `gray-50`                                       | New role: table headers, soft panels.                                  |
| `--color-surface-3`       | `#F1F5F9`                                  | `#232327`                                  | `--surface-3`               | `gray-100`                                      | New role: read-only inputs, segmented track, progress track.           |
| `--color-hover`           | `#F1F5F9`                                  | `#26262B`                                  | `--hover`                   | `gray-100` / `gray-800`                         | New role.                                                              |
| `--color-border`          | `#E4E7EC`                                  | `#2A2A2F`                                  | `--border`                  | `gray-200` `#e2e8f0` / `gray-800`               | Light ≈ same; dark neutral.                                            |
| `--color-border-strong`   | `#D0D5DD`                                  | `#3A3A40`                                  | `--border-strong`           | `gray-300` `#cbd5e1`                            | Inputs, secondary buttons. See contrast note.                          |
| `--color-fg`              | `#0F172A`                                  | `#F4F4F5`                                  | `--text`                    | `gray-900` / `gray-100`                         | Same light value.                                                      |
| `--color-fg-muted`        | `#475467`                                  | `#B4B4BC`                                  | `--text-2`                  | `gray-600` `#475569`                            | Near-identical light.                                                  |
| `--color-fg-subtle`       | `#5D6B82`                                  | `#9A9AA3`                                  | `--text-3`                  | `gray-500` `#64748b`                            | Darker in the reference (better contrast).                             |
| `--color-brand`           | `#2563EB`                                  | `#2563EB`                                  | `--brand`                   | `brand-500`                                     | Identical.                                                             |
| `--color-brand-hover`     | `#1D4ED8`                                  | `#3B6FF0`                                  | `--brand-hover`             | `brand-600`                                     | Dark hover lightens (new value).                                       |
| `--color-brand-press`     | `#1E40AF`                                  | `#1D4ED8`                                  | `--brand-press`             | `brand-700`                                     | —                                                                      |
| `--color-brand-soft`      | `#EFF6FF`                                  | `rgba(96,165,250,.12)`                     | `--brand-soft`              | `brand-50`                                      | Dark uses translucent tint.                                            |
| `--color-brand-soft-2`    | `#DBEAFE`                                  | `rgba(96,165,250,.2)`                      | `--brand-soft-2`            | `brand-100`                                     | Focus ring fill, avatar background.                                    |
| `--color-brand-ink`       | `#1D4ED8`                                  | `#93C5FD`                                  | `--brand-ink`               | `brand-600` / `brand-300`                       | Links, active tab text (light).                                        |
| `--color-on-brand`        | `#FFFFFF`                                  | `#FFFFFF`                                  | `--on-brand`                | `white`                                         | —                                                                      |
| `--color-nav-bg`          | `#FFFFFF`                                  | `#141416`                                  | `--nav-bg`                  | `white` / `gray-900`                            | Sidebar and drawers.                                                   |
| `--color-nav-active-bg`   | `#EFF6FF`                                  | `#26262B`                                  | `--nav-active-bg`           | `brand-50` / brand tint                         | Dark nav active is neutral, not blue.                                  |
| `--color-nav-active-fg`   | `#1D4ED8`                                  | `#FFFFFF`                                  | `--nav-active-ink`          | `brand-600`                                     | —                                                                      |
| `--color-success` / `-bg` | `#067647` / `#ECFDF3`                      | `#4ADE80` / `rgba(74,222,128,.12)`         | `--success`, `--success-bg` | Tailwind `green-700`/`emerald-*` on `green-50`  | Replaces raw Tailwind scales.                                          |
| `--color-warning` / `-bg` | `#B54708` / `#FFFAEB`                      | `#FBBF24` / `rgba(251,191,36,.12)`         | `--warning`, `--warning-bg` | Tailwind `amber-*`                              | —                                                                      |
| `--color-danger` / `-bg`  | `#B42318` / `#FEF3F2`                      | `#F87171` / `rgba(248,113,113,.12)`        | `--danger`, `--danger-bg`   | Tailwind `red-600` on `red-50`                  | —                                                                      |
| `--color-danger-solid`    | `#B42318`                                  | `#DC2626`                                  | `.btn-d` (dark hard-coded)  | `red-600`                                       | **New token** for the reference's hard-coded dark destructive button.  |
| `--color-info` / `-bg`    | `#1D4ED8` / `#EFF6FF`                      | `#93C5FD` / `rgba(96,165,250,.12)`         | `--info`, `--info-bg`       | Tailwind `blue-*`                               | —                                                                      |
| `--color-neutral-bg`      | `#F2F4F7`                                  | `#26262B`                                  | `--neutral-bg`              | `gray-100`                                      | Neutral badge.                                                         |
| `--color-chart-1…4`       | `#2563EB`, `#93C5FD`, `#F59E0B`, `#0F766E` | `#60A5FA`, `#3F3F46`, `#FBBF24`, `#2DD4BF` | `--chart-1…4`               | none                                            | New.                                                                   |
| `--color-grid`            | `#EEF1F5`                                  | `#26262B`                                  | `--grid`                    | none                                            | Chart gridlines.                                                       |
| `--color-scrim`           | `rgba(15,23,42,.45)`                       | `rgba(0,0,0,.6)`                           | `--scrim`                   | `bg-gray-900/50`-style utilities                | Overlay backdrop.                                                      |
| `--color-auth-panel`      | `var(--color-brand)`                       | `#18181B` + left border                    | `.auth-art`                 | none                                            | **New token** for the hard-coded dark auth panel.                      |
| `--color-switch-thumb`    | `#FFFFFF`                                  | `#FFFFFF`                                  | `.switch::after`            | none                                            | **New token** (hard-coded in the reference).                           |

Palette tier (inside `theme.css` only): `--palette-blue-*` = today's `brand-25…950` (already the reference blue), `--palette-neutral-light-*` (reference light greys above), `--palette-neutral-dark-*` (reference zinc greys above), status hues. Rebranding swaps `--palette-blue-*`.

## 3. Interaction states

| State                             | Reference rule                                                                    | Token(s)                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Hover — primary button            | background `--brand-hover`                                                        | `--color-brand-hover`                                                                                                                |
| Hover — secondary/ghost/nav/menu  | background `--hover`, text `--text`                                               | `--color-hover`, `--color-fg`                                                                                                        |
| Pressed                           | `--brand-press` (defined, not used by any rule)                                   | `--color-brand-press` (`:active`)                                                                                                    |
| Focus — inputs, OTP               | border `--brand` + `0 0 0 4px --brand-soft-2`                                     | `--color-brand`, `--color-brand-soft-2`                                                                                              |
| Focus — buttons, links, nav, tabs | **not defined in the reference**                                                  | Keep the existing global `:focus-visible` outline: 2 px `--color-brand`, offset 2 ([DR-028](./discrepancy-register.md#dr-028)).      |
| Selected — tab                    | text `--brand-ink`, 2 px underline `--brand`; dark: `--text` + `--text` underline | `--color-brand-ink`, `--color-brand`, dark override                                                                                  |
| Selected — segmented              | `--surface` pill + shadow; dark `--hover`                                         | `--color-surface`, `--shadow-xs`                                                                                                     |
| Selected — nav                    | `--nav-active-bg` / `--nav-active-ink`                                            | nav tokens                                                                                                                           |
| Disabled                          | **not defined**                                                                   | Introduce: 50% opacity + `cursor: not-allowed`, keep text contrast for read-only (`input[readonly]` uses `--surface-3` / `--text-2`) |
| Error — input                     | border `--danger`, message `.err-t` 13 px `--danger`                              | `--color-danger`                                                                                                                     |

## 4. Typography

| Token            | Reference                                                                                           | Current                                              | Notes                              |
| ---------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| `--font-sans`    | `'Outfit', system-ui, sans-serif`                                                                   | dashboards `--font-outfit` (next/font); public Inter | Outfit everywhere via `next/font`. |
| `--font-mono`    | `'JetBrains Mono', ui-monospace, monospace` 13 px                                                   | none (`--font-*: initial` removes defaults)          | Add via `next/font`.               |
| `--text-display` | 56 / 1.08, 600, −0.025em (phone 34–38)                                                              | `text-hero` (Solid)                                  | Marketing hero.                    |
| `--text-h1`      | 28 / 1.2, 600, −0.01em (phone 24)                                                                   | `DashboardHeader` h1 28                              | —                                  |
| `--text-section` | 36, −0.02em (phone 26)                                                                              | Solid `sectiontitle*`                                | Marketing section heading.         |
| `--text-h2`      | 20 / 1.3, 600 (phone 18)                                                                            | `text-theme-xl` 20/30                                | —                                  |
| `--text-h3`      | 16 / 1.4, 600                                                                                       | —                                                    | Card titles.                       |
| `--text-lead`    | 19 (phone 17), `--text-2`                                                                           | —                                                    | Marketing lead.                    |
| `--text-body`    | 15 / 1.5                                                                                            | Tailwind `text-sm`/`text-base` mix                   | Base body size is 15 px.           |
| `--text-small`   | 13–14                                                                                               | `text-theme-sm` 14/20                                | Labels 14/500; hints 13.           |
| `--text-caption` | 12 (eyebrow 12/600/0.06em uppercase; table header 12/600/0.04em uppercase; nav label 11/600/0.08em) | `text-theme-xs` 12/18                                | —                                  |
| `--text-stat`    | 28/600 (phone 20)                                                                                   | `StatCard` value                                     | —                                  |
| `--text-price`   | 40/600 (phone 32)                                                                                   | —                                                    | Plan cards.                        |

## 5. Spacing and sizing

Tailwind's 4 px spacing scale covers every reference gap (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 72, 80, 96 px) and is retained. Layout sizes become tokens:

| Token                                 | Value                                 | Reference                                    |
| ------------------------------------- | ------------------------------------- | -------------------------------------------- |
| `--size-sidebar`                      | 260 px                                | `.side` (today 224 px expanded / 72 px rail) |
| `--size-topbar`                       | 68 px                                 | `.top` min-height (today 64 px)              |
| `--size-mobile-topbar`                | 64 px                                 | `.m-top`                                     |
| `--size-mobile-tabbar-item`           | 52 px                                 | `.m-tabs a`                                  |
| `--size-nav-drawer`                   | 304 px (max 86%)                      | `.m-drawer`                                  |
| `--size-dialog`                       | 520 px                                | `.modal`                                     |
| `--size-drawer`                       | 520 px                                | `.drawer`                                    |
| `--size-content`                      | 1280 px                               | `.content` (today 1600 px)                   |
| `--size-marketing`                    | 1200 px                               | `.wrap`                                      |
| `--size-auth-form`                    | 420 px                                | `.auth-box`                                  |
| `--size-control`                      | 44 px                                 | buttons, inputs, nav, tabs, icon buttons     |
| `--size-control-sm`                   | 36 px                                 | `.btn-sm`, segmented buttons                 |
| `--space-page` / `--space-page-phone` | 32 px / 20 px (16 px in `.m` content) | `.content`                                   |
| `--space-card` / `--space-card-phone` | 24 px / 16 px                         | `.card-b`                                    |

## 6. Radius

| Token           | Value   | Used by                                            |
| --------------- | ------- | -------------------------------------------------- |
| `--radius-sm`   | 8 px    | small buttons, nav items, chips, segmented buttons |
| `--radius-md`   | 10 px   | buttons, inputs, icon buttons, icon tiles          |
| `--radius-lg`   | 12 px   | alerts, soft panels, OTP boxes, segmented track    |
| `--radius-xl`   | 14 px   | cards                                              |
| `--radius-2xl`  | 18 px   | dialogs, product shot (phone dialog 20 px)         |
| `--radius-full` | 9999 px | badges, switches, avatars, progress                |

Today: hard-coded `rounded-lg/xl/[10px]/3xl` in components; no radius tokens.

## 7. Shadows and elevation

| Token         | Light                                             | Dark                         | Current                              |
| ------------- | ------------------------------------------------- | ---------------------------- | ------------------------------------ |
| `--shadow-xs` | `0 1px 2px rgba(16,24,40,.05)` (cards)            | `none`                       | `shadow-theme-xs` (same light value) |
| `--shadow-sm` | `0 1px 3px rgba(16,24,40,.12)` (selected segment) | `none`                       | `shadow-theme-sm` (different)        |
| `--shadow-lg` | `0 12px 32px rgba(16,24,40,.14)`                  | `0 16px 40px rgba(0,0,0,.5)` | `shadow-theme-lg` (different)        |

Elevation in dark mode relies on surface steps (`bg` → `surface` → `surface-2/3`), not shadows.

| Layer token   | Value | Reference                              |
| ------------- | ----- | -------------------------------------- |
| `--z-sticky`  | 20    | sticky top bar                         |
| `--z-tabbar`  | 30    | `.m-tabs` (2 inside an artboard)       |
| `--z-overlay` | 40    | `.overlay` (5)                         |
| `--z-drawer`  | 50    | `.drawer`, `.m-drawer`, `.m-sheet` (6) |
| `--z-popover` | 60    | menus, popovers                        |
| `--z-tooltip` | 70    | tooltips                               |

Replaces `--z-index-1/50/999/9999` (defined but unused; components use literal `z-30/40/50`).

## 8. Breakpoints

| Token                | Value   | Current        | Role                                          |
| -------------------- | ------- | -------------- | --------------------------------------------- |
| `sm`                 | 640     | 640            | —                                             |
| `md`                 | 768     | 768            | phone layout below (reference: 700)           |
| `lg`                 | 1024    | 1024           | persistent sidebar from here (reference: 900) |
| `xl`                 | 1280    | 1280           | content max width reached                     |
| `2xl`                | 1536    | 1536           | —                                             |
| `2xsm`, `xsm`, `3xl` | removed | 375, 425, 2000 | TailAdmin-only                                |

See TD-08 and [DR-026](./discrepancy-register.md#dr-026).

## 9. Navigation dimensions

Sidebar 260 px, padding 20/16, item min-height 44, radius 8, icon 20, gap 12; section label 11 px uppercase; footer separated by a border. Top bar 68 px, padding 14/32 (phone 12/20). Mobile tab bar: 5 columns, item 52 px, icon 22, label 11.5 px, sticky bottom with safe-area padding. Drawer 304 px.

## 10. Charts

`--color-chart-1` primary series (successful, new, current), `--color-chart-2` secondary/comparison (light blue in light mode, zinc in dark), `--color-chart-3` warning-type series (failed or cancelled), `--color-chart-4` tertiary; `--color-grid` gridlines; axis labels 11 px `--color-fg-subtle`; area fill `--color-chart-1` at 12% opacity; chart height 240 px (phone 180 px); legend swatch 10 px, radius 3.

## 11. Contrast verification (computed, WCAG 2.2)

All text/background pairs used by the reference pass AA (4.5:1) in both themes. Lowest: light `--text-3` on `--bg` 5.03:1, light `--text-3` on `--surface-2` 5.16:1, light `--on-brand` on `--brand` 5.17:1, light `--warning` on `--warning-bg` 5.20:1, dark `--danger` on `--danger-bg` 5.41:1, dark white on `#DC2626` 4.83:1.

Non-text contrast (1.4.11, 3:1) issues:

| Pair                                                    | Ratio  | Affected                                    | Recommendation                                                                                                                                                      |
| ------------------------------------------------------- | ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Light `--border-strong` `#D0D5DD` vs `--surface`        | 1.47:1 | input and select borders, secondary buttons | Inputs also have labels and a 44 px filled area; still, raise to ≈ `#98A2B3` (≥ 2.5:1) or accept with design sign-off ([DR-029](./discrepancy-register.md#dr-029)). |
| Dark `--border-strong` `#3A3A40` vs `--surface`         | 1.57:1 | same, dark                                  | Same decision.                                                                                                                                                      |
| Light switch "off" track (`--border-strong`) vs surface | 1.47:1 | `Switch` off state                          | The thumb + label convey state, but add an inset border or darker track.                                                                                            |
| Light `--brand-soft-2` focus ring vs surface            | 1.22:1 | input focus                                 | Acceptable only because the border also turns `--brand` (5.17:1); keep both.                                                                                        |
| Dark `--brand` border vs `--surface`                    | 3.43:1 | dark input focus                            | Passes 3:1.                                                                                                                                                         |

## 12. Migration with minimal breakage

1. FE-UI-003 adds `theme.css` with the semantic tokens **and** temporary aliases: `--color-brand-500/600/700/50/100` → semantic brand tokens, `--color-gray-*` kept as palette values, so every un-migrated component renders unchanged in light mode and acceptably in dark mode.
2. Apps switch their `globals.css` import from `tailadmin-theme.css` to `@template/ui-core/theme.css` in the same ticket; the public portal drops the Solid `@theme` once FE-UI-009 replaces its sections.
3. Each component ticket moves its components from `brand-*`/`gray-*`/`dark:` pairs to semantic utilities.
4. A lint rule (FE-UI-004) blocks hex/rgb literals and raw Tailwind palette colour classes (`green-*`, `emerald-*`, `red-*`, `amber-*`, `blue-*`, `slate-*`) in `packages/*/src` and `apps/*/src`, with an allow-list for brand logos.
5. FE-UI-032 deletes the aliases and `tailadmin-theme.css`.
