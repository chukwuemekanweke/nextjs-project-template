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
    apps/*/src/features/**,
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
  controls (`FormField` takes an optional `labelAction`, for example a
  "Forgot password?" link), `Steps` (phones show only the current label),
  Radix `Dialog`/`ConfirmDialog`/`Tabs`/`Switch`/
  `SegmentedControl`, `DataTable`, `Pager`, `Alert`, skeletons and
  empty/error states; deprecated compatibility APIs (`buttonClassName`,
  `Modal`, `Pagination`, `StatusBadge`, `IconContainer`, `StatCard`,
  `SectionHeader`, `SettingsRow`); the presentation-only `formatMinorUnits`
  money formatter (also used by the Public Portal); and the shared theme
  (`theme.css`, `ThemeProvider`, `ThemeSwitch`, `ThemeSelect`).
- `@template/dashboard-ui` (depends on `ui-core`) exposes reusable dashboard
  layout mechanics (FE-UI-004): `DashboardShell` (sidebar from `lg`, sticky
  `DashboardTopbar`, 1280px content, optional phone `MobileTabBar`),
  `DashboardSidebar`/`DashboardSidebarNav` (labelled groups; 260px or a 72px
  rail with tooltips, widths from the `w-sidebar*` tokens), `MobileNavDrawer`
  (below `lg`, on `ui-core` `Drawer`), `DashboardBrand` (portal `badge`),
  `Breadcrumbs`, `ProfileMenu`/`AccountSummary` (Radix dropdown),
  `ThemeToggle` (= `ThemeSwitch`), the page header `DashboardHeader`, and pure
  `isNavItemActive`/`resolveActiveNavHref` (one current item: the most
  specific matching href). It owns no routes, session, permissions or API
  calls: apps supply navigation data and icons, breadcrumb trails, identity,
  account actions (each spreads the props a menu item passes), sign-out and
  feature availability. `AuthLayout` (Trello FE-UI-006) is the split
  authentication frame: brand + `ThemeSwitch` header, content at the
  `auth-form` width, footer, and a brand panel (`AuthPanel`, `auth-panel`
  tokens) from `lg`; `AuthHeading` renders each screen's single `h1`. Apps
  supply brand, copy and panel; the User Portal wraps it once as
  `UserAuthLayout`, the Admin Portal composes it in its sign-in page. `@template/dashboard-ui/charts` holds chart
  foundations (`ChartFrame`, `ChartLegend`, series colour helpers); Recharts
  is deferred (TD-10).
- App navigation (`apps/*/src/config/navigation.ts`) lists only implemented
  routes (tests check a `page.tsx` exists for each); the complete reference
  navigation is a workbench fixture. User identity comes from
  `useCurrentProfile` via the profile BFF; the admin portal has no identity
  read and shows the admitted role.
- Reference sample data (names, balances, scores, sessions, payments) never
  renders as account data. Feature data without a backend source shows an
  honest unavailable state or is omitted; typed preview fixtures live beside
  the feature (for example `app/dashboard/dashboard-preview.fixtures.ts`), are
  imported only by tests, and are never a fallback for a failed request or
  behind a production toggle. A class-D screen without a backend (identity
  verification, Trello FE-UI-009) is built as a feature-local composition in
  `apps/user-portal/src/features/verification` with no route, navigation item
  or production import; actions are intents passed through an `onAction`
  callback and render disabled without one. Its app tests are the preview
  harness (not the workbench) and fail if production code imports the
  fixtures or adds the route early. The User Portal dashboard composes existing
  api-react hooks (plan, two-factor, passkeys, sessions, billing history) and
  adds no API operations; `/preferences` uses `ThemeSelect` and marks language
  and notification settings as preview-only (DR-087–DR-090).
- Admin feature patterns (Trello FE-UI-012) live in
  `apps/admin-portal/src/components/admin-patterns` (`AdminKpiCard`,
  `AdminChartSection` on `ChartFrame`, `AdminSummaryCard`, `AdminRangeFilter`,
  `AdminListCard`/`AdminDetailHeader`, `AdminForbidden`,
  `AdminStepUpDialog`); usage in `docs/design-system/admin-patterns.md`. Each
  panel takes a typed state (`ready`/`loading`/`unavailable`/`error`/`empty`);
  the admin overview (`app/_dashboard`) renders every panel unavailable until
  admin read APIs exist, with reference figures only in a test fixture.
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
- `@template/public-ui` (Trello FE-UI-005) exposes token-based marketing
  sections composed from `ui-core`: `MarketingHeader` (full navigation from
  `lg`) with `MarketingMobileMenu` (full-screen ui-core `Drawer`),
  `MarketingFooter`, `MarketingContainer`/`MarketingSection`, `Hero`,
  `SectionHeading`, `FeatureGrid`, `NumberedFeatureList`, decorative
  `ProductShot` (no figures), `CtaBanner`, `PlanCard`/`PlanGrid`/
  `PlanGridSkeleton`, `PricingIntervals`, `FaqGrid`, `BlogCard`/`BlogGrid`,
  `ContactLayout`, `LegalDocument`, and typed content inputs. It never reads
  the router: apps pass `activeHref` and a brand node. The Public Portal owns
  concrete copy, navigation (`config/site.tsx`), URLs, metadata, page
  assembly, `SiteHeader` (pathname) and `SiteBrand` (configured logo).
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
