# Existing UI assessment

The current presentation layer graded against [target-ui-architecture.md](./target-ui-architecture.md). Evidence comes from the source on base commit `f1610f0`. Verdicts:

- **RETAIN** — already suitable; keep as is (restyle through tokens only).
- **REFACTOR** — right concept, wrong implementation or API; rework in place.
- **REPLACE** — unsuitable; build the target equivalent and delete the old one.
- **REMOVE** — obsolete under the target architecture.
- **INTRODUCE** — required capability that does not exist.

Non-visual infrastructure (`api-client`, `api-react`, BFF routes, `proxy.ts`, session/cookie code, `config`, CI/CD) is outside this grading and is preserved unchanged.

## 1. Summary

| Area                                                                    | Verdict                                 | Why                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind CSS v4 + PostCSS                                               | RETAIN                                  | Right engine for a token-driven design (TD-01).                                                                                                                                                                                           |
| `packages/dashboard-ui/src/tailadmin-theme.css`                         | REPLACE                                 | Raw brand/slate scales, no semantic or status tokens, no radius/spacing tokens, TailAdmin breakpoints; neutral palette differs from the reference (slate vs reference grey/zinc). Superseded by `@template/ui-core/theme.css`.            |
| Public Portal Solid `@theme` (`apps/public-portal/src/app/globals.css`) | REMOVE                                  | Separate design language (Inter, `#006bff` primary, Solid tokens); the reference uses one language everywhere.                                                                                                                            |
| `packages/ui-core`                                                      | REFACTOR (heavily)                      | Correct role (domain-free primitives) but TailAdmin-derived visuals, string-built variants, inaccessible `Modal`, no `Button`/`Badge`/menus/switches.                                                                                     |
| `packages/dashboard-ui`                                                 | REFACTOR                                | Correct role (shell mechanics, apps own nav) but the layout (224/72 px rail, `<details>` menu, flat nav) differs from the reference (260 px grouped nav, mobile tab bar, drawer).                                                         |
| `packages/public-ui`                                                    | REPLACE                                 | Solid-derived, not self-contained (depends on public-portal tokens and `/images/*` assets), `framer-motion` everywhere, mis-encoded glyphs; none of its sections match the reference compositions. Keep the idea of typed content inputs. |
| `packages/forms`                                                        | RETAIN infrastructure / REFACTOR fields | RHF + Zod + backend validation mapping are sound; field visuals and missing field types need work.                                                                                                                                        |
| App feature UI (`apps/*/src/app/**`)                                    | REFACTOR                                | Workflows are correct and tested; presentation is hand-rolled in many places (auth pages, checkout, billing cards) and must be recomposed from primitives without touching hooks, BFF calls or state rules.                               |
| `next-themes`                                                           | RETAIN, extend                          | Already in the public portal; becomes the theme engine everywhere (TD-07).                                                                                                                                                                |
| `framer-motion`                                                         | REMOVE                                  | The reference has no motion language (TD-18).                                                                                                                                                                                             |
| `qrcode.react`                                                          | RETAIN                                  | Needed for 2FA setup; presentation-neutral.                                                                                                                                                                                               |
| `next/font` Outfit                                                      | RETAIN; Inter REPLACE                   | Outfit + JetBrains Mono everywhere (TD-06).                                                                                                                                                                                               |
| Vitest + `renderToStaticMarkup` tests                                   | RETAIN                                  | They protect view logic; supplemented, not replaced.                                                                                                                                                                                      |
| Radix UI, `cva`, `tailwind-merge`, `clsx`, `lucide-react`               | INTRODUCE                               | TD-03, TD-04, TD-05.                                                                                                                                                                                                                      |
| Storybook workbench, Vitest browser mode, Playwright, axe               | INTRODUCE (proposed)                    | TD-15–17.                                                                                                                                                                                                                                 |
| Recharts                                                                | INTRODUCE (deferred)                    | TD-10, only with admin analytics.                                                                                                                                                                                                         |

## 2. `@template/ui-core`

| Export (file)                                                                                  | Verdict  | Target                                                                                                                        | Notes                                                                                                        |
| ---------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Alert` (`alert.tsx`)                                                                          | REFACTOR | `Alert` with tones `info/success/warning/danger/neutral`, title + body + action slot                                          | Keep dismiss/auto-dismiss and `role=alert/status`; uses `emerald`/`blue` today instead of tokens.            |
| `buttonClassName`, `ButtonVariant`, `ButtonSize` (`button.tsx`)                                | REPLACE  | `Button`, `buttonVariants`, `IconButton` (`primary, secondary, ghost, danger, danger-outline`; `sm`/`md`; `block`; `asChild`) | Keep `buttonVariants()` for rare non-button elements; current `accent` variant has no reference counterpart. |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (`card.tsx`) | REFACTOR | Same names; radius 14, header/body/footer paddings 18/24, 24, 16/24; phone 14/16                                              | Concept matches `.card`, `.card-h`, `.card-b`, `.card-f`.                                                    |
| `StatCard` (`card.tsx`)                                                                        | REFACTOR | `Stat` + `StatGrid`                                                                                                           | Reference stat = label, value, delta/meta, optional icon tile (hidden on phones).                            |
| `FormField`, `FormLabel`, `Input`, `Select`, `Textarea` (`form.tsx`)                           | REFACTOR | `Field` (label/hint/error wiring), `Input`, `NativeSelect`, `Textarea`, `SearchInput`                                         | Heights 44, radius 10, focus = brand border + 4 px `brand-soft-2` ring.                                      |
| 33 icons (`icons.tsx`)                                                                         | REPLACE  | curated `lucide-react` re-exports with size presets                                                                           | App-local brand SVGs stay in apps.                                                                           |
| `Modal` (`modal.tsx`)                                                                          | REPLACE  | `Dialog` / `ResponsiveDialog` on Radix                                                                                        | Current modal lacks focus trap, `Esc` and portal — an accessibility defect for existing flows.               |
| `Pagination` (`pagination.tsx`)                                                                | REPLACE  | `Pager` ("Showing a–b of n", Previous/Next)                                                                                   | Numbered links render every page; the reference shows Previous/Next only.                                    |
| `StatusBadge`, `StatusTone` (`settings.tsx`)                                                   | REPLACE  | `Badge` (`neutral, success, warning, danger, info`; dot)                                                                      | Status mapping functions in apps remain.                                                                     |
| `IconContainer`                                                                                | REFACTOR | `IconTile` (40 px, radius 10, tones)                                                                                          | Matches `.ico`.                                                                                              |
| `SectionHeader`, `SettingsRow`                                                                 | REFACTOR | `CardHeader` + `ListRow`                                                                                                      | Reference "settings" rows are `.list-row`.                                                                   |
| `EmptyState`                                                                                   | REFACTOR | `EmptyState` + new `ErrorState`                                                                                               | —                                                                                                            |
| `Skeleton`                                                                                     | RETAIN   | restyle via tokens                                                                                                            | —                                                                                                            |
| `DataTable`, `TableColumn` (`table.tsx`)                                                       | REFACTOR | `DataTable` with stacked phone mode, loading/empty/error rows                                                                 | API close to target; add `mobileLabel`, `align`, `mobilePrimary`.                                            |
| `Tabs`, `TabItem` (`tabs.tsx`)                                                                 | REFACTOR | `Tabs` on Radix with controlled/URL-driven mode and link variant                                                              | Current keyboard support is good; needs controlled value for `?tab=`.                                        |
| `formatMinorUnits` and helpers (`formatting/money.ts`)                                         | RETAIN   | unchanged                                                                                                                     | Backend-authoritative money formatting (OKF).                                                                |

**INTRODUCE in `ui-core`:** `ThemeProvider`, `ThemeSwitch`, `ThemeSelect`, `cn`, `Badge`, `Chip`, `Avatar`, `Spinner`, `Progress`, `Steps`, `Timeline`, `KeyValueList`, `ListRow`, `Divider`, `SegmentedControl`, `Switch`, `Checkbox`, `RadioGroup`/`RadioCard`, `OtpInput` (presentational), `DropdownMenu`, `Popover`, `Tooltip`, `Drawer`, `Sheet`, `CopyButton`, `PlanCard`, `ErrorState`, date formatting helper.

## 3. `@template/dashboard-ui`

| Export                                                                               | Verdict  | Target                                                                | Notes                                                                                             |
| ------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `DashboardShell`                                                                     | REFACTOR | `AppShell`                                                            | 260 px sidebar, 68 px top bar, 1280 px content max; mobile chrome per portal.                     |
| `DashboardSidebar`, `DashboardSidebarNav`, `isNavItemActive`, `DASHBOARD_SIDEBAR_ID` | REFACTOR | `Sidebar`, `SidebarNav` with groups (`label` + items) and footer slot | Keep `isNavItemActive` and its tests.                                                             |
| Collapsed 72 px rail + tooltips, `SidebarProvider` `isExpanded`                      | REMOVE   | —                                                                     | No reference counterpart ([DR-025](./discrepancy-register.md#dr-025)).                            |
| `MobileNav`                                                                          | REPLACE  | `MobileTopBar`, `MobileNavDrawer`, `MobileTabBar`                     | Reference has a bottom tab bar (user) and a drawer (both).                                        |
| `Breadcrumbs`                                                                        | RETAIN   | restyle                                                               | Matches `.crumbs`.                                                                                |
| `DashboardHeader`                                                                    | REFACTOR | `PageHeader`                                                          | Reference: h1 28 + description + right-aligned actions; optional back link; no icon tile/eyebrow. |
| `DashboardBrand`                                                                     | REFACTOR | `BrandMark` (32 px tile, radius 9)                                    | —                                                                                                 |
| `ProfileMenu` (`<details>`)                                                          | REPLACE  | `UserIdentity` (avatar, name, email/role) + `DropdownMenu`            | Today's identity text is hardcoded ([DR-027](./discrepancy-register.md#dr-027)).                  |
| `ThemeToggle`                                                                        | REPLACE  | `ui-core` `ThemeSwitch`                                               | Removes the flash-of-light-theme.                                                                 |
| `tailadmin-theme.css`                                                                | REPLACE  | moves to `@template/ui-core/theme.css`                                | —                                                                                                 |
| Types `DashboardNavItem`, `BreadcrumbItem`, `UiNode`                                 | REFACTOR | add `DashboardNavGroup`, mobile tab item type                         | —                                                                                                 |

**INTRODUCE in `dashboard-ui`:** `AuthLayout`, `FilterBar`, `./charts` subpath (deferred).

## 4. `@template/public-ui`

| Export                                                              | Verdict  | Target                                                                 |
| ------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `PublicUiProvider` (next-themes)                                    | REMOVE   | `ui-core` `ThemeProvider`                                              |
| `Header`                                                            | REPLACE  | `MarketingHeader` + mobile `Sheet`                                     |
| `Footer`                                                            | REPLACE  | `MarketingFooter` (three columns)                                      |
| `Hero`                                                              | REPLACE  | `Hero` (chip, display heading, lead, two CTAs, optional `ProductShot`) |
| `SectionHeading`                                                    | REFACTOR | same name                                                              |
| `Features`                                                          | REPLACE  | `FeatureCardGrid`, `NumberedFeatureList`                               |
| `Cta`                                                               | REPLACE  | `CtaBanner`                                                            |
| `Pricing`                                                           | REPLACE  | app composes `ui-core` `PlanCard` + `SegmentedControl`                 |
| `Faq`                                                               | REPLACE  | `FaqList` (reference shows static Q/A cards, not an accordion)         |
| `Testimonials`, `LogoCloud`                                         | REMOVE   | no reference ([DR-030](./discrepancy-register.md#dr-030))              |
| `BlogCard`                                                          | REPLACE  | `BlogCardGrid`                                                         |
| `ContactSection`                                                    | REPLACE  | `ContactLayout`; the app owns submission (none today)                  |
| Content types (`LinkItem`, `FeatureItem`, `FaqItem`, `BlogPost`, …) | REFACTOR | keep typed-content approach; reshape to the new sections               |

`apps/public-portal/public/images/{shape,hero,icon,…}` assets used only by Solid sections are REMOVED with them; `LICENSE.solid` follows TD-20.

## 5. `@template/forms`

| Export                                                        | Verdict               | Notes                                                                                                                                             |
| ------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useValidatedForm`, `ValidatedForm`, `applyBackendValidation` | RETAIN                | Core workflow infrastructure.                                                                                                                     |
| `TextField`, `PasswordField`                                  | REFACTOR              | New visuals; `PasswordField` drops inline styles.                                                                                                 |
| `SearchableSelectField`                                       | REFACTOR              | Restyle; consider Radix Popover for the listbox positioning.                                                                                      |
| `ConfirmationCodeField`                                       | REFACTOR → `OtpField` | Keep paste/autofill/`groupAfter`/configurable length.                                                                                             |
| `SubmitButton`                                                | REFACTOR              | Render `Button` with `loading` state instead of caller class strings.                                                                             |
| —                                                             | INTRODUCE             | `SelectField`, `TextareaField`, `CheckboxField`, `SwitchField`, `RadioCardGroupField`, `SegmentedField`, `PasswordStrength` (app supplies rules). |

## 6. Application presentation code

| Location                                                                                                         | Verdict           | Notes                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/*/src/components/*-layout-shell.tsx`                                                                       | REFACTOR          | Compose `AppShell`; identity from real profile/session; fix "Manage sessions" → `/security` ([DR-027](./discrepancy-register.md#dr-027)). |
| Auth pages (user `sign-in`, `register`, `confirm-email`, `sign-in/two-factor`, `passkey-setup`; admin `sign-in`) | REFACTOR          | Replace hand-rolled centred layouts and button classes with `AuthLayout` + primitives; logic files under `src/lib/*` untouched.           |
| `apps/user-portal/src/app/security/**`                                                                           | REFACTOR          | Re-tab to six URL-addressable tabs; cards → `ListRow`/`DataTable`; dialogs → `Dialog`.                                                    |
| `apps/user-portal/src/app/billing/**`                                                                            | REFACTOR          | Restyle only; `lib/billing-view.ts`, checkout attempt/idempotency and payment-return resolution unchanged.                                |
| `apps/admin-portal/src/app/page.tsx`                                                                             | REFACTOR          | Restyled placeholder until admin APIs exist.                                                                                              |
| `apps/public-portal/src/app/**` + `src/config/site.ts`                                                           | REFACTOR          | Recompose pages from new `public-ui`; content config reshaped.                                                                            |
| App-local icons (`checkout-icons.tsx`, `browser-icon.tsx`, Google logo)                                          | RETAIN / REFACTOR | Brand logos stay; generic glyphs move to Lucide.                                                                                          |

## 7. Defects found during the assessment

Fix inside the migration tickets that touch them (not in FE-UI-001):

- `Modal` has no focus trap, `Esc` handling or portal (affects every existing dialog).
- Mis-encoded characters in `packages/public-ui/src/components/{faq,header,testimonials}.tsx` render as garbage; the same mojibake appears in comments of `tailadmin-theme.css`.
- `NEXT_PUBLIC_BRAND_PRIMARY_COLOUR` is injected as `--brand-primary` in dashboard layouts but never consumed ([DR-005](./discrepancy-register.md#dr-005)).
- Profile menus show hardcoded identity ("Signed-in user", "Signed-in administrator"); user "Manage sessions" links to `/` ([DR-027](./discrepancy-register.md#dr-027)).
- Admin navigation links to five routes that 404 ([DR-071](./discrepancy-register.md#dr-071)).
- Dashboard `EmptyProfile` copy says profile management "becomes available" although it exists.
- Theme toggle applies the theme in `useEffect`, causing a flash of the light theme on dark preference.
