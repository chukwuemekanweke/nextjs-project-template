# Technology decisions

Each decision records: the design-system requirement, the current implementation, viable alternatives, the recommendation, trade-offs, migration complexity and long-term maintainability. Criteria applied throughout: suitability for the reference, accessibility, maintainability, performance, developer experience and reuse across future SaaS projects. Exact library versions are pinned in the pnpm `catalog` by the ticket that introduces them (choose the current stable release at that time); this document fixes the choice, not the version.

Status legend: **Accepted** (recommended; implement in the referenced ticket) · **Proposed** (recommended but needs explicit sign-off listed in [discrepancy-register.md](./discrepancy-register.md#open-decisions)).

## Summary

| ID    | Decision                                                               | Status              | Ticket         |
| ----- | ---------------------------------------------------------------------- | ------------------- | -------------- |
| TD-01 | Keep Tailwind CSS v4 as the styling engine                             | Accepted            | FE-UI-003      |
| TD-02 | Two-tier CSS-variable tokens, one `theme.css` in `ui-core`             | Accepted            | FE-UI-003      |
| TD-03 | Radix UI primitives for interactive behaviour                          | Accepted            | FE-UI-005      |
| TD-04 | Owned component source + `class-variance-authority` + `tailwind-merge` | Accepted            | FE-UI-004      |
| TD-05 | `lucide-react` icons                                                   | Accepted            | FE-UI-004      |
| TD-06 | Outfit + JetBrains Mono via `next/font` in all apps                    | Accepted            | FE-UI-003      |
| TD-07 | `next-themes` for light/dark/system in all apps                        | Accepted            | FE-UI-003      |
| TD-08 | Tailwind default breakpoints; phone < `md`, sidebar ≥ `lg`             | Accepted            | FE-UI-003      |
| TD-09 | Own `DataTable` with stacked phone mode; no data-grid engine           | Accepted            | FE-UI-006      |
| TD-10 | Recharts for admin analytics, deferred                                 | Accepted (deferred) | FE-UI-031      |
| TD-11 | Radix Dialog-based overlays with responsive sheet                      | Accepted            | FE-UI-005      |
| TD-12 | No toast library; inline alerts                                        | Accepted            | —              |
| TD-13 | Keep React Hook Form + Zod                                             | Accepted            | FE-UI-007      |
| TD-14 | Keep the four UI packages, re-scoped; no new design-system package     | Accepted            | FE-UI-003..009 |
| TD-15 | Storybook workbench in `tooling/ui-workbench`                          | Proposed            | FE-UI-002      |
| TD-16 | Vitest browser mode for component interaction tests                    | Proposed            | FE-UI-002      |
| TD-17 | Playwright for visual regression, a11y scans and journeys              | Proposed            | FE-UI-002      |
| TD-18 | Remove `framer-motion`; CSS-only motion                                | Accepted            | FE-UI-009      |
| TD-19 | Native date inputs in a popover for date ranges (initially)            | Accepted            | FE-UI-006      |
| TD-20 | Remove TailAdmin/Solid-derived code and notices after replacement      | Proposed            | FE-UI-032      |

---

## TD-01 Styling engine

- **Requirement:** utility-friendly styling of ~60 component patterns with theme-swapped tokens, responsive variants and zero runtime cost.
- **Current:** Tailwind v4.3 via `@tailwindcss/postcss` in all apps.
- **Alternatives:** CSS Modules + custom properties; vanilla-extract; Panda CSS; CSS-in-JS (styled-components/Emotion).
- **Recommendation:** keep Tailwind v4.
- **Trade-offs:** long class lists (mitigated by `cva` variants and primitives); v4 `@theme inline` maps CSS variables to utilities natively. CSS-in-JS has runtime cost and RSC friction; vanilla-extract/Panda add build tooling for no design benefit.
- **Migration complexity:** none (retained).
- **Maintainability:** high; widely known; tokens stay in CSS where designers can read them.

## TD-02 Token architecture

- **Requirement:** ~45 semantic tokens swapped per theme (reference `.tp` / `.tp.dark`), neutral-grey dark mode, rebrandable blue.
- **Current:** `tailadmin-theme.css` defines raw `brand-*` and slate `gray-*` scales; components pair every class with a `dark:` variant; status colours are raw Tailwind `green/emerald/red/amber/blue`; the public portal has a separate Solid token set.
- **Alternatives:** (a) keep raw scales + `dark:` pairs; (b) semantic CSS variables swapped by `.dark`; (c) a tokens build pipeline (Style Dictionary, Tokens Studio) generating CSS/TS.
- **Recommendation:** (b) two tiers — palette variables, then semantic variables swapped under `.dark`, bound to Tailwind with `@theme inline` — in one `@template/ui-core/theme.css` shared by all apps.
- **Trade-offs:** (a) doubles every colour decision and cannot express the reference's dark-mode role changes (e.g. tabs turn neutral) without per-component logic. (c) is worthwhile only with a design-tool sync, which the reference (static HTML) does not provide.
- **Migration complexity:** medium. Provide temporary aliases (`--color-brand-500` → `--color-brand`, `gray-*` → semantic equivalents) so un-migrated components keep rendering until FE-UI-032 removes them.
- **Maintainability:** high; theming and rebranding become token edits.

## TD-03 Accessible headless primitives

- **Requirement:** dialogs, drawers, sheets, dropdown/filter menus, popovers, tooltips, tabs, segmented controls, switches, checkboxes, radio cards — with focus management, keyboard support and screen-reader semantics.
- **Current:** hand-written `Modal` (no focus trap, no `Esc`, no portal), accessible custom `Tabs`, `<details>` profile menu, raw checkboxes; no menus, popovers or switches.
- **Alternatives:** Radix UI; React Aria Components (Adobe); Base UI; Headless UI; Ark UI; continue hand-writing.
- **Recommendation:** Radix UI primitives.
- **Trade-offs:** Radix is unstyled, mature, composes with Tailwind through `data-state` attributes, supports React 19, and is the most common foundation in the Next.js ecosystem (lowest onboarding cost for a template). React Aria has the strongest internationalisation and date/number components and stricter a11y, but a heavier, more opinionated API; it remains the fallback for complex date pickers (TD-19). Base UI is a credible newer alternative with a similar model; Headless UI's component set is too small (no toggle group or toolbar). Hand-writing focus traps is the main source of current a11y gaps.
- **Migration complexity:** medium; replaces `Modal`, `Tabs`, menus during FE-UI-005.
- **Maintainability:** high; behaviour bugs are fixed upstream; our code is styling and API shape only.

## TD-04 Component authoring model

- **Requirement:** variant-rich primitives (6 button variants × 2 sizes × block, 5 badge tones, 4 alert tones, …) that apps can extend without forking.
- **Current:** `buttonClassName()` string helper with `[...].join(" ")`; no `Button` component; auth and billing pages hand-write button classes.
- **Alternatives:** install a styled library (MUI, Mantine, Chakra); shadcn/ui CLI-generated code; owned source with `cva` + `tailwind-merge`; `tailwind-variants`.
- **Recommendation:** owned source in `ui-core`, built on Radix, with `class-variance-authority` for variants and `tailwind-merge` + `clsx` inside a single `cn()` helper.
- **Trade-offs:** styled libraries would fight the reference's precise look and ship their own theming; generated shadcn code is a good starting point (copy patterns, not the CLI) but its defaults differ from the reference. `tailwind-variants` is equivalent; `cva` is smaller and more widely used.
- **Migration complexity:** low per component; high overall surface (every `apps/*` usage of `buttonClassName` and hand-written classes).
- **Maintainability:** high; one place per pattern, typed variants.

## TD-05 Icons

- **Requirement:** ~60 outline icons, 24 px grid, 1.8 stroke, round caps; nav (20 px), buttons (18 px), tab bar (22 px).
- **Current:** 33 hand-drawn icons in `ui-core/icons.tsx` plus app-local SVGs.
- **Alternatives:** Lucide; Heroicons; Tabler; Phosphor; keep hand-drawn.
- **Recommendation:** `lucide-react`, re-exported through a curated `ui-core` icon module with size presets.
- **Trade-offs:** the reference geometry matches Lucide (e.g. `layout-grid`, `trending-up`, `activity` paths); tree-shaken per icon; maintaining a hand-drawn set does not scale to the ~60 icons needed.
- **Migration complexity:** low.
- **Maintainability:** high.

## TD-06 Typography

- **Requirement:** Outfit for all text, JetBrains Mono for references and codes.
- **Current:** dashboards load Outfit via `next/font`; public portal loads Inter.
- **Alternatives:** self-hosted `@font-face`; Google CDN links (as in the reference files); `next/font`.
- **Recommendation:** `next/font/google` for both families in each root layout (existing OKF rule: no CDN links or `@font-face`); public portal switches from Inter to Outfit.
- **Trade-offs:** none material; `next/font` self-hosts at build.
- **Migration complexity:** low.
- **Maintainability:** high.

## TD-07 Theme management

- **Requirement:** light, dark and "Match system", switch in every top bar/drawer, no flash, consistent across server and client rendering.
- **Current:** dashboards use a custom `ThemeToggle` (localStorage `theme`, applied in `useEffect` → flash of light theme, no system option in UI); public portal uses `next-themes`.
- **Alternatives:** keep custom toggle + add an inline blocking script; `next-themes` everywhere; cookie-based server-rendered theme.
- **Recommendation:** `next-themes` in all apps via a `ui-core` `ThemeProvider` (class attribute, `enableSystem`, default `system`).
- **Trade-offs:** cookie-based SSR theme avoids the script but needs per-request rendering of every page (conflicts with static marketing pages). `next-themes` is tiny, already a dependency, handles cross-tab sync.
- **Migration complexity:** low; keep the `theme` storage key so stored preferences survive.
- **Maintainability:** high.

## TD-08 Breakpoints and responsive model

- **Requirement:** desktop (1440) and phone (390) artboards; phone layout under 700 px; sidebar becomes a column at ≥ 900 px.
- **Current:** TailAdmin breakpoints `2xsm 375, xsm 425, sm 640, md 768, lg 1024, xl 1280, 2xl 1536, 3xl 2000`; sidebar fixed from `lg`.
- **Alternatives:** custom breakpoints at 700/900 to copy the reference literally; Tailwind defaults with mapped thresholds; container queries only.
- **Recommendation:** Tailwind defaults (`sm`–`2xl`); phone layout below `md` (768), persistent sidebar from `lg` (1024); container queries (`@container`) inside cards where a component must respond to its slot rather than the viewport.
- **Trade-offs:** deviates from the reference's 700/900 by up to 124 px; the reference's own 700–900 band is an artefact (the sidebar wraps above content) rather than a designed layout, and a 260 px sidebar + 560 px main column needs ~820 px plus padding, so 1024 is the safer persistent-sidebar threshold. Standard breakpoints keep every Tailwind example and team habit valid.
- **Migration complexity:** low; remove unused `2xsm/xsm/3xl` usages during component migration.
- **Maintainability:** high. Recorded as [DR-026](./discrepancy-register.md#dr-026).

## TD-09 Tables

- **Requirement:** ~25 server-paginated tables, 4–8 columns, badges/avatars/actions in cells, filters in a toolbar, phone card-stacking, one permission matrix.
- **Current:** `DataTable` (columns + rows, horizontal scroll) and numbered link `Pagination`.
- **Alternatives:** TanStack Table (headless); AG Grid / MUI DataGrid; own component.
- **Recommendation:** own `DataTable` + `Pager` in `ui-core`; server-side sort/filter/pagination via URL search params in apps. Re-evaluate TanStack Table only if a screen needs client-side sorting, column visibility or virtualisation.
- **Trade-offs:** no designed screen needs client-side data-grid features; a grid engine adds API surface without benefit. The stacked phone mode is a presentation concern we must own regardless.
- **Migration complexity:** low–medium (billing history, security activity, sessions).
- **Maintainability:** high.

## TD-10 Charts

- **Requirement:** line/area, grouped and stacked bars, donut, horizontal bars; token colours; dark mode; accessible alternative.
- **Current:** none.
- **Alternatives:** Recharts; visx; Chart.js (canvas); Apache ECharts; Nivo; Tremor.
- **Recommendation:** Recharts wrapped in `@template/dashboard-ui/charts`, introduced with the first analytics screen.
- **Trade-offs:** SVG output reads CSS variables directly (dark mode for free) and is React-idiomatic; visx is lower level (more code per chart); canvas libraries cannot use CSS variables and need manual theme plumbing; ECharts is heavy; Tremor brings its own design language.
- **Migration complexity:** none now; isolated subpath export keeps it out of the user and public bundles.
- **Maintainability:** good; wrappers limit coupling to the library.

## TD-11 Overlays

- **Requirement:** modal (bottom sheet on phones), right drawer, left nav drawer, full-screen menu sheet; scrim; focus trap; `Esc`; return focus.
- **Current:** `Modal` without trap/`Esc`/portal; CSS off-canvas sidebar; no drawer.
- **Alternatives:** Radix Dialog for all; Vaul for gesture sheets; native `<dialog>`.
- **Recommendation:** Radix Dialog as the single engine for `Dialog`, `Drawer`, `Sheet`, `MobileNavDrawer`, with a `ResponsiveDialog` that switches presentation below `md`.
- **Trade-offs:** native `<dialog>` lacks consistent scroll locking and animation hooks; Vaul adds drag gestures the reference does not show.
- **Migration complexity:** medium (≈10 existing modals in the user portal).
- **Maintainability:** high.

## TD-12 Notifications

- **Requirement:** none in the reference — feedback is inline (`.alert`), and actions stay on the page.
- **Current:** inline `Alert` with optional auto-dismiss; no toast system.
- **Recommendation:** do not introduce a toast library. Keep inline alerts and `aria-live` regions (already used for copy-to-clipboard).
- **Maintainability:** fewer global moving parts. Revisit only if a reference adds toasts.

## TD-13 Forms

- **Requirement:** validated forms with backend error mapping, OTP, password strength, radio cards, switches.
- **Current:** React Hook Form + Zod + `applyBackendValidation` in `@template/forms`.
- **Recommendation:** keep the infrastructure unchanged; rebuild only the field visuals on `ui-core` controls; add missing field types.
- **Migration complexity:** low; the workflow code in apps does not change.

## TD-14 Package organisation

- **Requirement:** one design language across three apps, clear ownership, no app logic in packages, public bundle free of dashboard code.
- **Current:** `ui-core` (TailAdmin-derived primitives), `dashboard-ui` (shell + the theme file), `public-ui` (Solid-derived, depends on public-portal tokens), `forms`.
- **Alternatives:** (a) one `@template/ui` package with subpath exports; (b) add a `@template/design-tokens` package; (c) keep four packages, re-scope contents.
- **Recommendation:** (c). Move tokens into `ui-core` (they are not dashboard-specific); keep `dashboard-ui` for app chrome and charts, `public-ui` for marketing sections, `forms` for connected fields.
- **Trade-offs:** (a) blurs the ownership rules OKF already enforces and makes accidental cross-imports easy; (b) separates a single CSS file into its own package for no consumer benefit — `@template/ui-core/theme.css` is enough. (c) keeps dependency rules, OKF concepts and `transpilePackages` stable.
- **Migration complexity:** low structurally; the contents change.
- **Maintainability:** high.

## TD-15 Component workbench

- **Requirement:** preview every component and every reference state (including unsupported ones) in isolation with typed fixtures, light/dark and desktop/phone, without shipping fixtures to production.
- **Current:** none.
- **Alternatives:** Storybook; Ladle; hidden preview routes inside the apps; no workbench.
- **Recommendation:** Storybook (React + Vite builder, a11y addon) in a private, non-deployed workspace `tooling/ui-workbench` (requires adding `tooling/*` to `pnpm-workspace.yaml`).
- **Trade-offs:** Storybook is heavier than Ladle but has the a11y addon, docs pages for token specimens, interaction testing and the widest familiarity. Preview routes inside apps risk shipping fixtures and weaken the "no mock in production" rule. Requires the devops-toolkit CI callers to accept an extra job (open decision OD-05).
- **Migration complexity:** medium (one-time setup; Next-specific APIs like `next/link` are mocked).
- **Maintainability:** good if stories live next to components and the workbench only aggregates them.

## TD-16 Component interaction tests

- **Requirement:** verify focus trapping, keyboard navigation, ARIA state and variants of primitives.
- **Current:** Vitest with `renderToStaticMarkup` and mocked hooks; no DOM runner.
- **Alternatives:** jsdom + Testing Library; Vitest browser mode (real browser via Playwright); Storybook interaction tests.
- **Recommendation:** Vitest browser mode for `ui-core`, `forms` and `dashboard-ui` interaction tests; keep `renderToStaticMarkup` tests for app view logic.
- **Trade-offs:** jsdom lacks layout, pointer capture and real focus behaviour that Radix relies on, producing polyfill-heavy, low-fidelity tests. Browser mode reuses the Playwright install from TD-17.
- **Migration complexity:** low (additive).

## TD-17 Visual regression, accessibility scanning, journeys

- **Requirement:** protect live journeys while the presentation is replaced; compare against the reference; check WCAG.
- **Current:** none (documented gap in `docs/architecture/11-subscriptions-and-billing.md`).
- **Alternatives:** Playwright `toHaveScreenshot`; Chromatic/Percy (hosted); Loki/BackstopJS.
- **Recommendation:** Playwright with screenshots generated in the official Playwright container image for determinism, `@axe-core/playwright` for scans, and MSW-backed API mocking for app journeys.
- **Trade-offs:** hosted services give review UIs but add cost and send screenshots to a third party; self-hosted baselines need disciplined update reviews.
- **Migration complexity:** medium; see [verification-strategy.md](./verification-strategy.md).

## TD-18 Motion

- **Requirement:** none beyond hover/state colour changes.
- **Current:** `framer-motion` reveal animations in `public-ui`.
- **Recommendation:** remove `framer-motion`; use CSS transitions on colour/opacity and Radix `data-state` keyframes for overlays, all disabled under `prefers-reduced-motion`.
- **Trade-offs:** smaller public bundle, no client boundary for static marketing sections.

## TD-19 Date-range input

- **Requirement:** admin filter buttons such as "27 Oct – 25 Nov 2026 (UTC)".
- **Current:** none.
- **Alternatives:** two native `<input type="date">` in a `Popover`; `react-day-picker`; React Aria `DateRangePicker`.
- **Recommendation:** native inputs in a `Popover` with presets first; adopt `react-day-picker` or React Aria only if usability testing shows the native control is insufficient.
- **Trade-offs:** native inputs are accessible and dependency-free but vary by browser.

## TD-20 Third-party notices

- **Requirement:** OKF and AGENTS.md require preserving `LICENSE.tailadmin` and `LICENSE.solid` for derived code.
- **Current:** notices in `packages/ui-core`, `packages/dashboard-ui`, `packages/public-ui`, `apps/public-portal`.
- **Recommendation:** keep every notice while any derived code remains; remove a notice only in the ticket that deletes the last derived file of that package, with a reviewer confirming no derived code remains (open decision OD-06).
