# Verification strategy

How FE-UI implementation tickets prove that they match the design, stay accessible and do not break existing behaviour. Tooling choices are TD-15–TD-17 in [technology-decisions.md](./technology-decisions.md); the harness itself is delivered by FE-UI-002 ([migration-roadmap.md](./migration-roadmap.md#fe-ui-002--verification-harness-and-ui-workbench)).

## 1. Layers

| Layer                 | Tool                                                                                                     | Runs on                           | Purpose                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Static                | `pnpm format:check`, `pnpm lint` (incl. token, fixture-isolation and `jsx-a11y` rules), `pnpm typecheck` | every PR                          | Formatting, forbidden imports/colours, contract types (fixtures typed by `api-client` contracts) |
| Unit / view logic     | Vitest (existing, `renderToStaticMarkup`)                                                                | every PR                          | Billing/payment/auth view rules, navigation, formatting — unchanged by visual tickets            |
| Component interaction | Vitest browser mode (Playwright provider)                                                                | every PR touching `packages/*` UI | Keyboard, focus, ARIA state, variants of primitives and fields                                   |
| Visual regression     | Playwright `toHaveScreenshot`                                                                            | every PR touching UI              | Primitives and screen views in the workbench; key app pages with a mocked backend                |
| Accessibility scan    | `@axe-core/playwright`, Storybook a11y addon                                                             | every PR touching UI              | WCAG 2.2 A/AA rules on stories and pages                                                         |
| Functional journeys   | Playwright + MSW-mocked backend (BFF routes run for real)                                                | every PR                          | Protect sign-in, refresh, authorization, profile, security and billing journeys                  |
| Build                 | `pnpm build`                                                                                             | every PR                          | Independent app builds                                                                           |

## 2. Component verification

For every primitive and connected field:

- one story per variant × state (default, hover/focus via play functions, disabled, error, loading) in light and dark;
- interaction tests: keyboard operation (Tab/Shift+Tab, Enter/Space, arrows for tabs/radios/segmented/menus, `Esc` for overlays), focus trap and focus return for dialogs/drawers/sheets, `aria-*` state (`aria-checked`, `aria-selected`, `aria-expanded`, `aria-invalid`, `aria-describedby` linking hints and errors), OTP paste and autofill, copy-button live-region announcement;
- axe scan of every story with zero violations (exceptions documented inline with a reason);
- `DataTable`: header semantics on desktop; label/value pairs announced correctly in stacked mode (the visual label is not the only label).

## 3. Visual regression

### Viewports and themes

| Name      | Size       | Used for                                                         |
| --------- | ---------- | ---------------------------------------------------------------- |
| `phone`   | 390 × 844  | reference mobile artboards                                       |
| `tablet`  | 834 × 1112 | layout transition smoke (drawer navigation with desktop density) |
| `desktop` | 1440 × 900 | reference desktop artboards (full-page screenshots)              |

Themes: `light` and `dark` via the `next-themes` class; reduced motion forced on.

### Matrix (kept deliberately small)

| Subject                                                                                                 | Matrix                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Primitives (workbench stories)                                                                          | each variant: desktop × light; one combined "all variants" story per component: desktop × dark |
| Shells (dashboard, marketing, auth layout)                                                              | phone/tablet/desktop × light/dark                                                              |
| Screens — default state                                                                                 | phone/desktop × light/dark (4 shots)                                                           |
| Screens — each extra business state (e.g. billing `pending`, checkout result `cancelled`, security tab) | desktop × light, plus phone × dark                                                             |
| Overlays (dialog, drawer, sheet, menus)                                                                 | open state: phone × light, desktop × dark                                                      |

This yields four shots per screen plus two per extra state, instead of the full 4 × states product.

### Baselines

- Generated and compared only inside the official Playwright Docker image (fonts and rendering stay stable); developers run `pnpm test:visual` through the same container.
- Stored in the repository next to the specs (`__screenshots__/`), updated only by an explicit `--update-snapshots` run whose diff is reviewed in the PR. Never auto-accept on CI.
- Dynamic content is frozen: fixed clock, fixture data, masked avatars/QR codes, `animation: none`.
- Threshold: `maxDiffPixelRatio` 0.001 for primitives, 0.01 for full pages.

### Reference comparison (design fidelity)

Pixel-diffing implementation against the reference is not meaningful (different data, fonts rendered by different pipelines). Instead:

1. A script in the harness renders the canonical reference file listed in `screen-inventory.json` (at commit `d23eb85`, checked out to a temporary directory, never committed) at the same viewport and theme and saves it as `reference.png` in the test output.
2. The PR's visual report shows **reference | implementation | diff** side by side for each screen state touched.
3. A reviewer signs off on fidelity; the approved implementation screenshot becomes the baseline for regression.

## 4. Functional regression

Journeys run against the real Next.js apps (`next build && next start`) with the backend mocked at the network boundary (MSW handlers or a mock server built from `api-client` contracts and fixtures), so BFF routes, cookies, `proxy.ts` and refresh coordination execute for real.

| Journey                                                                             | Assertions                                                                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Password sign-in → dashboard                                                        | session cookies set (HttpOnly), `returnTo` honoured and sanitised                                |
| Sign-in with 2FA (authenticator and recovery code)                                  | challenge cookie flow, expiry and restart                                                        |
| Passkey sign-in cancelled / unsupported                                             | silent cancel, disabled control with explanation                                                 |
| Google outcomes (authenticated, link required, registration required, 2FA)          | correct follow-up screen; GIS button rendered                                                    |
| Expired access token                                                                | proxy refresh succeeds once; failed refresh redirects to `/sign-in?returnTo=` and clears cookies |
| Logout                                                                              | cookies cleared, query cache and checkout attempt cleared                                        |
| Registration → confirm email → passkey setup skip                                   | step validation, cooldown, redirect chain                                                        |
| Forgot/reset password (after FE-UI-013)                                             | identical "sent" state for unknown email; expired-link state                                     |
| Profile edit and avatar upload                                                      | validation mapping; storage upload without app headers                                           |
| Security: revoke session, sign out others, 2FA setup/disable, passkey rename/remove | targeted query invalidation reflected in the UI                                                  |
| Billing: discovery, pending, active, cancelling, past due                           | `billing-view.ts` view selection rendered                                                        |
| Checkout: submit, idempotent retry, hosted redirect (HTTPS only), bank transfer     | attempt storage and key reuse rules                                                              |
| Payment return (success/cancelled/return)                                           | outcome only from purchase status; polling exhaustion message                                    |
| Admin sign-in                                                                       | admitted with role; rejected without role (logout + cleared cookies); non-admin cannot reach `/` |
| Public pricing → checkout deep link                                                 | `planId`/`billingInterval` carried through sign-in                                               |

Existing Vitest suites remain the first line: a visual ticket must not modify `*.test.ts` of view logic (`billing-view`, `payment-return`, `sign-in`, `two-factor`, `checkout-*`) except to add cases.

## 5. Accessibility

| Area                    | Requirement                                                                                                                                                                                                              | How verified                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Semantic HTML           | landmarks (`header`, `nav` with labels, `main`, `aside`, `footer`); one `h1` per page; real `<table>` for tabular data; `<dl>` for key-value lists; buttons vs links by behaviour                                        | axe; review checklist                                  |
| Keyboard                | every action reachable; logical order; no traps outside modals; skip link to main content in shells                                                                                                                      | interaction tests; journey keyboard pass               |
| Focus                   | visible `:focus-visible` ring on every interactive element (DR-028); focus moves into dialogs and returns to the trigger; route changes move focus to the page heading                                                   | component tests                                        |
| Dialogs and drawers     | `role=dialog`/`aria-modal`, labelled by title, `Esc` closes, background inert, scroll locked                                                                                                                             | Radix + tests                                          |
| Forms                   | visible labels; hints and errors linked via `aria-describedby`; `aria-invalid`; errors announced; OTP inputs labelled as a group; autocomplete attributes (`email`, `current-password`, `new-password`, `one-time-code`) | tests + axe                                            |
| Screen-reader semantics | status badges include text (not colour only); icon-only buttons have `aria-label`; decorative icons `aria-hidden`; charts paired with a table or text summary; live regions for async status (polling, copy)             | axe + manual NVDA/VoiceOver pass per phase             |
| Colour contrast         | text ≥ 4.5:1 (verified for all reference pairs, see [token-mapping.md §11](./token-mapping.md#11-contrast-verification-computed-wcag-22)); non-text ≥ 3:1 (open item DR-029)                                             | axe; token unit test computing ratios from `theme.css` |
| Responsive usability    | no horizontal page scroll at 320 px; text zoom 200%; reflow at 400% for content pages; 44 px targets (≥ 24 px minimum per WCAG 2.5.8)                                                                                    | Playwright viewport checks                             |
| Motion                  | respects `prefers-reduced-motion`                                                                                                                                                                                        | story with media emulation                             |

## 6. Repository verification

Every ticket that changes source or configuration runs, in order (AGENTS.md):

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

After FE-UI-002 the PR pipeline additionally runs `pnpm test:component`, `pnpm test:visual`, `pnpm test:e2e` and `pnpm workbench:build` (names fixed by FE-UI-002). Material changes to `apps/` or `packages/` finish with the OKF maintenance check and `okf lint -strict`.

Documentation-only changes (such as FE-UI-001) run `pnpm format:check` over the changed files, validate JSON outputs, check internal links and run `okf lint -strict` when OKF changes; the code checks are reported as skipped with the reason.

## 7. Definition of done for a screen ticket

- Screen states listed in `screen-inventory.json` that the backend supports are implemented in four variants (phone/desktop × light/dark); unsupported ones are omitted and recorded.
- Stories with fixtures exist for every implemented state; fixtures are not imported by production code.
- Visual baselines approved against the reference; axe clean; keyboard pass done.
- Existing tests unchanged and green; relevant journeys green.
- Screen record, discrepancy register and (if architecture changed) OKF updated.
