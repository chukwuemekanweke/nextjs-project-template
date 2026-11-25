# Integration strategy

How the design system is adopted in the three applications. [target-ui-architecture.md](./target-ui-architecture.md) describes _what_ we are building; this document is the working rulebook for every FE-UI implementation ticket.

## 1. Adoption rules

1. **The reference is the visual specification; the backend is the functional specification.** Match layout, tokens, components and copy tone from the pinned design. Never add a field, number, state or action the backend cannot provide; omit it and record it in the ticket. Example: the billing "Most popular" badge, the dashboard wallet balance and "Keep subscription" are omitted until the API provides them.
2. **Preserve behaviour, replace presentation.** Hooks (`@template/api-react`), BFF calls, `src/lib/*` view logic (`billing-view.ts`, `payment-return.ts`, `checkout-attempt.ts`, `sign-in.ts`, `two-factor.ts`…), schemas, redirects and guards are not rewritten in a visual ticket. If a visual change seems to need a logic change, split it into its own ticket.
3. **Primitives first.** Pages compose `ui-core` / `dashboard-ui` / `public-ui` / `forms` components. A page may not introduce raw colour values, ad hoc buttons, or its own modal. If a needed pattern is missing, add it to the owning package (with a story and tests) in the same ticket or a prerequisite one.
4. **No raw HTML transplant.** Reference files are read for structure and measurements; never paste their markup or `.tp` classes into React.
5. **Semantic tokens only.** No hex/rgb literals, no raw Tailwind palette classes (`green-*`, `slate-*`, …) and no `dark:` colour pairs in components; use semantic utilities (`bg-surface`, `text-fg-muted`, `bg-success-bg`). Brand logos are the only allow-listed exception.
6. **Public exports only.** Import `@template/ui-core`, `@template/ui-core/theme.css`, `@template/dashboard-ui`, `@template/dashboard-ui/charts`, `@template/public-ui`, `@template/forms`. Add an export only for a supported reusable API, and keep each app's `transpilePackages` and `@source` lists aligned.
7. **Server-first rendering.** Keep Server Components where they are today (`/dashboard`, `/profile` reads, public pages). Interactive primitives are `"use client"` per file; static primitives are server-safe. Do not convert a page to a client component just to use one interactive control — wrap the control.
8. **Respect security boundaries.** Browser code never imports `@template/api-client/server`, cookies or private env. Recovery codes, 2FA secrets and passkey data remain ephemeral UI state.
9. **Licensing.** While TailAdmin- or Solid-derived files remain in a package, keep its notice (TD-20).

## 2. Implementing a screen: procedure

1. Read the screen record in [`screen-inventory.json`](./screen-inventory.json) (route, states, backend operations, gaps, discrepancies) — no need to rediscover the design repository.
2. Open the canonical reference files listed under `design.referenceFiles` at commit `d23eb85` (desktop/mobile × light/dark × states). Use the `.dc.html` artboard only for interactive states it alone contains (pricing yearly prices, tab switching).
3. List the states the screen must render: every reference state that the backend supports + loading, empty, error, disabled and validation states (§5).
4. Split the page into a **container** (hooks, routing, mutations) and a **view** (props only). Existing container logic moves unchanged; the view is rebuilt from primitives. Views are what the workbench and visual tests render.
5. Add workbench stories with typed fixtures for each state (§6).
6. Update or add tests: existing view-logic tests must keep passing unchanged; add interaction/a11y tests for new primitives; update visual baselines (see [verification-strategy.md](./verification-strategy.md)).
7. Record any newly found discrepancy in [discrepancy-register.md](./discrepancy-register.md) and update the screen record (`implementation.status`, `uiGaps`) in the JSON and Markdown inventory.
8. Run the repository verification sequence and the OKF maintenance check.

## 3. Responsive rules

One component tree per logical screen; viewport differences are expressed as CSS or as a small set of explicit responsive components. Never create mobile routes or `*Mobile` page components.

| Concern              | Desktop (≥ `lg`)                                        | Tablet (`md`–`lg`)                 | Phone (< `md`)                                                                                             |
| -------------------- | ------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Dashboard navigation | 260 px sidebar, grouped                                 | `MobileTopBar` + `MobileNavDrawer` | User: `MobileTopBar` + `MobileTabBar` (≤ 5 items) + drawer. Admin: top bar + drawer + search button.       |
| Marketing navigation | inline nav + CTAs                                       | same, wrapping                     | compact bar (logo, Get started, menu) + full-screen `Sheet`                                                |
| Breadcrumbs          | top bar                                                 | top bar                            | hidden; page title carries context; back link where the reference shows one                                |
| Page header          | title left, actions right                               | same                               | stacked; action buttons stretch full width                                                                 |
| Cards and grids      | `auto-fit` grids (min 210/260/340 px)                   | same                               | stats 2 columns; other grids 1 column; card paddings 16 px                                                 |
| Tables               | full table, horizontal scroll inside the card if needed | same                               | stacked rows: first cell as title, other cells as label/value pairs (`mobileLabel`); actions right-aligned |
| Key-value lists      | two columns                                             | two columns                        | single column, label above value                                                                           |
| Forms                | two-column field rows where drawn                       | same                               | single column; footer buttons full width                                                                   |
| Dialogs              | centred, 520 px                                         | centred                            | bottom sheet, 16 px inset                                                                                  |
| Drawers              | right, 520 px                                           | right, 520 px                      | full width                                                                                                 |
| Steps                | labels on every step                                    | same                               | only the active step shows its label                                                                       |
| Auth layout          | form + brand panel                                      | form + panel (wraps)               | form only                                                                                                  |
| Charts               | 240 px                                                  | 240 px                             | 180 px; legends wrap                                                                                       |
| Touch targets        | 44 px controls (36 px small)                            | same                               | same; tab-bar items 52 px                                                                                  |

Differences that require more than CSS (and therefore explicit components): bottom tab bar, navigation drawer, marketing sheet, dialog-to-sheet switch, table stacking, admin top-bar search button. Ambiguities are recorded as [DR-022](./discrepancy-register.md#dr-022) and [DR-023](./discrepancy-register.md#dr-023).

## 4. Theme rules

- Light and dark are the same components; only tokens change. Visual tests cover both.
- In dark mode, blue is reserved for primary buttons, links and focus; active tabs and nav items become neutral (handled by tokens, not component logic).
- Default theme is the system preference; the user's explicit choice persists per portal (`next-themes`, storage key `theme`).
- Images or illustrations that differ per theme use CSS (`dark:` on an `<img>` swap) only when unavoidable; prefer token-coloured SVG.

## 5. UI states

Every screen handles the states below where applicable. "Exists" means implemented today; implementers must preserve those exactly.

| State                                                | Rule                                                                                                                | Existing handling (examples)                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Loading                                              | Skeletons shaped like the final layout; never show "empty" while loading                                            | `/dashboard` and `/profile` `loading.tsx`; billing skeletons |
| Empty                                                | `EmptyState` with next action where one exists                                                                      | billing history, passkeys, sessions                          |
| Error                                                | `ErrorState` or `Alert` with retry; never fall through to a success or "no data" view                               | billing `error` view; route `error.tsx`                      |
| Disabled                                             | `disabled` + visible reason when the cause is not obvious (unsupported browser, unsupported method)                 | passkeys unsupported; `Card` payment method disabled         |
| Validation                                           | inline field errors + form-level `Alert` for unmapped backend messages                                              | `applyBackendValidation` everywhere                          |
| Authentication required                              | handled by `proxy.ts` redirect to `/sign-in?returnTo=`                                                              | both dashboards                                              |
| Forbidden                                            | admin: in-shell `ADM-FORBIDDEN` state on backend `403`; user: error state                                           | not implemented                                              |
| Pending / processing                                 | badge + explanation + polling or "Check again"; bounded polling never becomes failure                               | purchase status polling, billing `pending` view              |
| Expired / cancelled / rejected / verified / past due | business states come only from backend fields (`lifecycleStatus`, purchase status, …) through app mapping functions | billing and payment-return mappings                          |
| Success                                              | only after a confirmed backend outcome                                                                              | payment return, profile save                                 |

Reference-only business states for unsupported capabilities (KYC `inprogress/pending/verified/rejected/expired`, wallet, billing `expired` banner, `pastdue` "Pay now") are implemented only when their backend arrives.

## 6. Fixtures and previews

Goal: every reference state can be previewed and visually tested, while production can never show fabricated data.

- **Where fixtures live:** next to the view they serve, in `*.fixtures.ts` files under a `__fixtures__/` folder (`apps/user-portal/src/app/billing/__fixtures__/billing-overview.fixtures.ts`, `packages/ui-core/src/data-table/__fixtures__/…`). They are typed with the real `@template/api-client` contract types (`GetCurrentSubscriptionQueryResponse`, …) so contract changes break fixtures at compile time.
- **Who may import them:** stories (`*.stories.tsx`), tests (`*.test.ts[x]`) and Playwright specs only. An ESLint `no-restricted-imports` rule (added in FE-UI-002) forbids importing `**/__fixtures__/**` or `*.fixtures` from any other file; production bundles therefore cannot contain them.
- **Preview adapters:** stories render **views** with fixture props. Where a container must be previewed, the story wraps it in an `ApiProvider` whose `ApiClient` is backed by MSW handlers (already a dev dependency of `api-client`) that return fixtures. No preview code path exists in `apps/*/src/app/**` or in BFF routes.
- **Sensitive outcomes:** fixtures for payments, wallet, KYC, authentication and security use obviously synthetic identifiers (`PUR-FIXTURE-0001`, `ada@example.com`, recovery codes like `FIXT-0000`) and are rendered only in the workbench and tests. Never add "demo mode" flags, environment switches or fallbacks that substitute fixtures for a failing or missing API.
- **Unsupported screens:** class-D screens (KYC, wallet, admin operations) may get workbench-only views and stories so design review can continue, but no route, navigation entry or production import until the backend exists.

## 7. Preserving existing functionality

| Risk                                                     | Guard                                                                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sign-in/2FA/passkey/Google flows regress while restyling | Keep `src/lib/*` and BFF routes untouched; Playwright journeys (FE-UI-002) must pass before and after each auth ticket. |
| Session refresh or guards weakened                       | No visual ticket edits `proxy.ts` except to add explicit public paths; route tests for public paths.                    |
| Billing state rules duplicated or changed                | `billing-view.ts` stays the single owner; its tests must not change in visual tickets.                                  |
| Checkout idempotency broken                              | `checkout-submission.ts` / `checkout-attempt.ts` unchanged; existing tests stay green.                                  |
| Fixture data leaks to production                         | Lint rule + bundle check in CI (search build output for `__fixtures__` markers).                                        |
| Identity/hardcoded values reintroduced                   | Shell identity comes from profile/session props only.                                                                   |

## 8. Ownership quick reference

| You are building…                                                                                       | Put it in               |
| ------------------------------------------------------------------------------------------------------- | ----------------------- |
| A visual primitive with no product meaning                                                              | `packages/ui-core`      |
| Dashboard/app chrome, auth layout, filter bar, chart wrapper                                            | `packages/dashboard-ui` |
| A marketing section or its typed content shape                                                          | `packages/public-ui`    |
| A connected form field or validation helper                                                             | `packages/forms`        |
| Navigation items, copy, page composition, status→badge mapping, workflows, BFFs, fixtures for app views | `apps/<portal>`         |
