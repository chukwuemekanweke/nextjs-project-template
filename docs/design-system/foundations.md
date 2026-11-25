# Design foundations: tokens, typography, themes and assets

Developer guide to the shared visual foundations delivered by the Trello card FE-UI-002 (roadmap scope "FE-UI-003 — Tokens, theme and typography", see [DR-077](./discrepancy-register.md#dr-077)). Token values and their reference mapping are in [token-mapping.md](./token-mapping.md); decisions are TD-01, TD-02, TD-06, TD-07 and TD-08 in [technology-decisions.md](./technology-decisions.md).

## 1. Ownership and exports

| What                                     | Where                                                                 | Public entry point                                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Palette and semantic tokens, base styles | `packages/ui-core/src/styles/theme.css`                               | `@template/ui-core/theme.css`                                                                                     |
| Theme provider and controls              | `packages/ui-core/src/theme/*`                                        | `@template/ui-core` (`ThemeProvider`, `ThemeSwitch`, `ThemeSelect`, `THEME_STORAGE_KEY`, `themeProviderSettings`) |
| TailAdmin compatibility utilities        | `packages/dashboard-ui/src/tailadmin-theme.css`                       | `@template/dashboard-ui/tailadmin-theme.css` (temporary)                                                          |
| Solid marketing tokens                   | `apps/public-portal/src/app/globals.css`                              | — (app-local, temporary)                                                                                          |
| Font loading                             | each app's `src/app/layout.tsx`                                       | —                                                                                                                 |
| Provider composition                     | each app's `src/components/app-providers.tsx`                         | —                                                                                                                 |
| Brand assets                             | each app's `public/images/{logo,favicon}`, referenced by branding env | —                                                                                                                 |

Application `globals.css`:

```css
@import "tailwindcss";
@import "@template/ui-core/theme.css";
/* Dashboards only, until FE-UI-032: */
@import "@template/dashboard-ui/tailadmin-theme.css";
@source "../../../../packages/ui-core/src";
```

`theme.css` does not add `@source` entries; each app lists the package sources it renders, so the public portal scans only `ui-core/src/theme` and the icons.

## 2. How tokens work

Two tiers:

1. **Palette** (`--palette-blue-*`, `--palette-slate-*`, `--palette-zinc-*`, status hues) on `:root`. Raw values; never used by components.
2. **Semantic** tokens that components use through Tailwind utilities:
   - Colours `--color-*` in `@theme static` (light values), redefined under `.dark`. `next-themes` puts `.dark` or `.light` on `<html>`.
   - Elevation, responsive type sizes and page/card padding use `@theme inline` over raw variables (`--elevation-*`, `--type-*`, `--space-*`) that change per theme or below `md` (768 px).
   - Static scales in `@theme`: fonts, fixed type sizes, radius, layers, recurring sizes, containers.

Components state intent; light/dark differences live only in `theme.css`:

```tsx
<section className="border-border bg-surface p-card rounded-xl border shadow-xs">
  <h2 className="text-h2">Billing</h2>
  <p className="text-small text-fg-muted">Next payment on 14 Nov 2026</p>
  <span className="bg-success-bg text-caption text-success inline-flex items-center gap-1.5 rounded-full px-2.5">
    <CheckIcon className="size-icon-xs" /> Active
  </span>
  <button className="min-h-control bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-press rounded-md px-4.5 disabled:opacity-50">
    Upgrade
  </button>
</section>
```

Rules:

- Use semantic utilities (`bg-surface`, `text-fg-muted`, `border-control-border`, `bg-danger-bg text-danger`, `z-overlay`, `h-control`, `max-w-content`). Do not add `dark:` colour pairs, hex values or raw Tailwind palette classes (`green-*`, `slate-*`, …) in new code.
- Use `border-control-border` (not `border-border-strong`) for inputs, selects, checkboxes and secondary-button outlines: it meets 3:1 ([DR-029](./discrepancy-register.md#dr-029)).
- Status always pairs colour with text or an icon.
- SVG and inline styles read the variables directly: `stroke="var(--color-chart-1)"`, `fill="var(--color-chart-area)"`. Chart conventions: series `chart-1…4`, gridlines `grid`, axis labels 11 px `text-chart-axis`, area fill `chart-area`.
- Numbers: `td`, `th`, `data` and `time` default to `tabular-nums`; add `tabular-nums` elsewhere for aligned amounts. Use `font-mono text-mono` for references and codes.
- `dark:` remains valid for non-colour differences such as swapping an icon or a themed image.

### Typography

| Utility         | Size (phone) | Weight / tracking | Use                            |
| --------------- | ------------ | ----------------- | ------------------------------ |
| `text-display`  | 56 (38)      | 600 / −0.025em    | marketing hero                 |
| `text-section`  | 36 (26)      | 600 / −0.02em     | marketing section title        |
| `text-h1`       | 28 (24)      | 600 / −0.01em     | page title                     |
| `text-h2`       | 20 (18)      | 600               | section / card group           |
| `text-h3`       | 16           | 600               | card title                     |
| `text-lead`     | 19 (17)      | 400               | marketing lead                 |
| `text-body`     | 15           | 400               | body (base size)               |
| `text-label`    | 14           | 500               | form labels                    |
| `text-small`    | 13           | 400               | hints, secondary lines         |
| `text-caption`  | 12           | 500               | captions                       |
| `text-overline` | 12           | 600 / 0.06em      | with `uppercase`; or `eyebrow` |
| `text-micro`    | 11           | 600 / 0.08em      | nav group labels               |
| `text-stat`     | 28 (20)      | 600               | dashboard stats                |
| `text-price`    | 40 (32)      | 600               | plan prices                    |
| `text-mono`     | 13           | 400               | with `font-mono`               |

## 3. Adding or changing a token

1. Add a palette value if the colour is new (`--palette-*` in the first `:root` block).
2. Add the semantic token to `@theme static` with its light value and, if it differs in dark mode, to the `.dark` block. Name it for its role (`--color-<role>`), not its hue.
3. If it is a non-colour value that changes per theme or viewport, add a raw variable in the `@layer theme` `:root` block (and `@media`/`.dark`) and bind it in `@theme inline`.
4. Add the expected light/dark values (and any text/background pair) to `packages/ui-core/src/styles/theme.test.ts`; it fails on reference drift or contrast below AA.
5. Add a swatch to the foundations preview (`apps/public-portal/src/app/foundations/foundation-specimens.ts`) and update [token-mapping.md](./token-mapping.md).

## 4. Rebranding the template

1. Replace the `--palette-blue-*` scale in `theme.css` (keep every step; `450` is the dark-mode hover). Semantic brand tokens, focus, nav, info and chart-1 follow, and so do the legacy `brand-*` utilities.
2. Optionally adjust the neutral palettes for a different grey family.
3. Run `pnpm --filter @template/ui-core test`. The contrast tests show whether the new brand still supports white text (`on-brand`), links (`brand-ink`) and focus.
4. Replace the logo and favicon files in each app's `public/images/` (the three apps carry identical copies because each deploys its own `public/` directory) or point `NEXT_PUBLIC_LOGO_LIGHT`, `NEXT_PUBLIC_LOGO_DARK` and `NEXT_PUBLIC_FAVICON` at new files. Set `NEXT_PUBLIC_PRODUCT_NAME` and the portal names.

`NEXT_PUBLIC_BRAND_PRIMARY_COLOUR` / `NEXT_PUBLIC_BRAND_ACCENT_COLOUR` are still validated and injected as `--brand-primary` / `--brand-accent`, but the semantic tokens deliberately ignore them; only the legacy Solid `primary` utility in the public portal reads `--brand-primary`. A single runtime colour cannot provide verified hover, pressed, soft, ink and focus steps. Whether to derive a palette from it or remove it is open decision OD-17 ([DR-005](./discrepancy-register.md#dr-005)).

## 5. Fonts

Each root layout loads both families with `next/font/google` (self-hosted at build; no browser requests to Google) and puts both variables on `<html>`:

```tsx
const outfit = Outfit({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-outfit-loaded",
});
const jetBrainsMono = JetBrains_Mono({
  display: "swap",
  preload: false,
  subsets: ["latin"],
  variable: "--font-jetbrains-mono-loaded",
});
// <html className={`${outfit.variable} ${jetBrainsMono.variable}`} ...>
```

`theme.css` maps them to `--font-sans` (Tailwind's default family, used by `<html>` and `font-sans`) and `--font-mono` (`font-mono`, `code`, `kbd`, `pre`). Both are variable fonts, so no weights are listed; Latin only. Outfit is preloaded; JetBrains Mono is not, because it appears on few pages (it swaps in from the `ui-monospace` fallback). Do not add `<link>` font tags or `@font-face` rules.

## 6. Theme management

- `ThemeProvider` (`next-themes`): class attribute, `defaultTheme: "system"`, `enableSystem`, `enableColorScheme`, `disableTransitionOnChange`, storage key `theme`. It is rendered once in each app's `AppProviders`, outside `ApiProvider`.
- Its inline script sets `.dark`/`.light` and `color-scheme` on `<html>` before first paint, so there is no flash. Root layouts set `suppressHydrationWarning` on `<html>` only, for those attributes.
- Preferences: `light`, `dark` or `system` in `localStorage["theme"]`, per portal origin (no cross-portal sync). Values saved by the previous dashboard toggle (`light`/`dark`) and the previous public provider remain valid. With no stored value the OS preference applies and changes live; `next-themes` also syncs tabs.
- Controls:
  - `ThemeSwitch`: compact light/dark toggle button (`aria-label="Dark theme"`, `aria-pressed` after hydration). Its icon follows the pre-paint `.dark` class, so it is correct before hydration.
  - `ThemeSelect`: Light / Dark / System radio group in a `fieldset` (native radios give arrow-key navigation); nothing is checked until hydration.
  - `ThemeToggle` (`@template/dashboard-ui`) remains as the shell entry point and renders `ThemeSwitch`. The public header renders `ThemeSwitch`.

```tsx
"use client";
import { ThemeProvider } from "@template/ui-core";
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <ApiProvider apiClient={browserApi}>{children}</ApiProvider>
    </ThemeProvider>
  );
}

// Anywhere under the provider:
<ThemeSwitch />
<ThemeSelect label="Appearance" />
```

## 7. Legacy compatibility (temporary)

| Kept                                                            | Where                              | Why                                                                             | Removed by                   |
| --------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- | ---------------------------- |
| `brand-25…950` (→ `--palette-blue-*`, theme-independent)        | `dashboard-ui/tailadmin-theme.css` | ~200 uses paired with explicit `dark:` classes                                  | component tickets, FE-UI-032 |
| slate `gray-25…950`, `gray-dark`                                | same                               | ~470 uses; values unchanged so dark mode of un-migrated screens stays as before | same                         |
| `shadow-theme-xs/sm/lg`                                         | same                               | billing cards, menus, inputs, pagination                                        | same                         |
| `no-scrollbar`, `<body>` stacking context                       | same                               | sidebar and tabs                                                                | same                         |
| Solid colours, type, containers, shadows, animations, utilities | `public-portal/globals.css`        | un-migrated `public-ui` sections                                                | FE-UI-009/010                |
| Solid radii (`sm` 4, `md` 6, `lg` 8 px) pinned                  | same                               | keeps marketing shapes while the dashboards use the reference radius scale      | FE-UI-009/010                |
| `bg-white dark:bg-black` on the public `<body>`                 | `public-portal/layout.tsx`         | Solid sections assume white/navy page backgrounds                               | FE-UI-009                    |

Removed because nothing used them: `font-outfit`, `text-theme-*`, `z-index-1/50/999/9999` (dashboards), `custom-scrollbar`, breakpoints `2xsm`/`xsm`/`3xl`, `PublicUiProvider`. `LICENSE.tailadmin` and `LICENSE.solid` are unchanged.

Visible changes to un-migrated screens: Outfit replaces Inter in the public portal; `rounded-sm/md/lg/xl/2xl` in dashboards are 8/10/12/14/18 px (previously 4/6/8/12/16); the dashboard `<body>` uses the semantic background (neutral `#0F0F11` in dark, visible on auth pages that do not set their own); default borders use `--color-border`; `font-mono` now renders JetBrains Mono (the old `--font-*: initial` reset left it undefined).

## 8. Assets

- Brand logos (light and dark variants) and favicons belong to each app's `public/images/` and are referenced only through the branding environment (`@template/config` `brandingFromEnvironment`). Metadata icons come from `branding.favicon`.
- Shared packages never hard-code product branding: `DashboardBrand` takes a name, the public `Header`/`Footer` take logo paths and alt text.
- Assets are not shared across apps by path: each portal deploys separately and serves only its own `public/`. Moving them into a package would require a build-time copy step for three small SVGs, so the copies stay (rebrand checklist in §4).
- Known exception: Solid-derived `public-ui` sections reference decorative images under the public portal's `/images/{shape,hero,icon}` paths. They are removed with those sections (FE-UI-009/010).

## 9. Accessibility decisions

- Focus: global 2 px `--color-focus` outline with 2 px offset on every interactive element ([DR-028](./discrepancy-register.md#dr-028)); `ThemeSelect` moves it to the visible segment.
- Disabled: `cursor: not-allowed` for `:disabled` and `[aria-disabled="true"]`; components add `disabled:opacity-50`. Busy: `[aria-busy="true"]` shows `cursor: progress`.
- Contrast is computed from `theme.css` in tests: all text pairs ≥ 4.5:1 and control borders, switch track and focus ≥ 3:1 in both themes. Exceptions: `--color-border-strong` stays at the reference value (1.47:1 / 1.57:1) and is for separators only; dark brand hover adjusted ([DR-076](./discrepancy-register.md#dr-076)).
- `prefers-reduced-motion: reduce` shortens all CSS animations and transitions globally.
- Status colours always come with text or an icon.

## 10. Preview and verification

- **Preview:** `pnpm --filter @template/public-portal dev`, then open `http://localhost:9002/foundations`. It is served only when `NODE_ENV === "development"` (a 404 in production builds, `noindex`) and renders swatches with live computed values, surface hierarchy, status, type scale, spacing and sizes, radius, elevation and layers, a chart-palette SVG, interaction states and both theme controls. It is not the Storybook workbench proposed in TD-15 (OD-05 is still open).
- **Automated:** `packages/ui-core/src/styles/theme.test.ts` (reference values, dark overrides, contrast, scales, font mapping) and `packages/ui-core/src/theme/theme-controls.test.tsx` (accessible, hydration-safe markup; provider settings).
- **Browser checks** (manual until the Playwright harness exists): stored and system preferences apply before first paint, OS changes apply live, the switch and the select persist across reloads, no hydration warnings, no Google Fonts requests, and no horizontal overflow at 390 and 1440 px in either theme.

## 11. Remaining work

- Migrate components from `brand-*`/`gray-*`/`dark:` pairs to semantic utilities (FE-UI-004 onwards), add the lint rule against raw palette classes (FE-UI-004), and delete the compatibility layer (FE-UI-032).
- Replace the Solid marketing styles and their pinned radii (FE-UI-009/010); fixes [DR-078](./discrepancy-register.md#dr-078) and the remaining [DR-021](./discrepancy-register.md#dr-021) glyphs.
- Dashboard shell dimensions: the shell (Trello FE-UI-004) uses `w-sidebar` (260px), `w-sidebar-collapsed` (72px rail), `min-h-topbar`/`min-h-topbar-mobile`, `w-nav-drawer`, `min-h-tabbar-item` and `max-w-content`; the drawer slides in with `animate-drawer-in-left` (skipped under reduced motion).
- Decisions: OD-05 (workbench and browser test jobs), OD-08 (control-border sign-off), OD-17 (runtime brand colour), DR-076 (dark hover value).
