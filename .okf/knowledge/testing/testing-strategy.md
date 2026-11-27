---
type: testing
title: Testing Strategy
description:
  Current Vitest coverage boundaries and expectations for infrastructure and
  application behavior
resource: okf://knowledge/testing/testing-strategy
tags: [context, testing, vitest, boundaries]
governance: context
code_refs:
  [
    apps/**/*.test.ts,
    apps/**/*.test.tsx,
    packages/**/*.test.ts,
    packages/**/*.test.tsx,
    tooling/ui-workbench/visual/**,
  ]
sources:
  - kind: file
    path: packages/api-client/src/client/request.test.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

Vitest tests are colocated with implementation. Current coverage focuses on
durable boundaries and pure behavior rather than broad browser rendering:

- `api-client`: HTTP request/response/error semantics, operation metadata,
  export safety, browser refresh coordination, BFF fetch behavior, and
  route-session helpers.
- `api-react`: key/options/hook policies and integration with domain clients.
- `forms`: backend validation mapping.
- `config`: schema validation and defaults.
- `ui-core`, `forms` and `dashboard-ui` browser tests (`*.browser.test.tsx`, Vitest browser
  mode with Playwright Chromium and reduced motion, `pnpm test:component`):
  keyboard and focus (dialog trap/return, tabs, switch, segmented control,
  OTP, `ThemeSelect` applying and storing Light/Dark/System), ARIA state, label/hint/error association, loading/duplicate-submit
  prevention, responsive `DataTable`, and React Hook Form integration. The
  node config excludes them.
- Visual regression (`pnpm test:visual`, `tooling/ui-workbench/visual`):
  `toMatchScreenshot` over composed workbench stories (primitive galleries at
  1440/390 × light/dark, dialogs, and a selective desktop dashboard-shell
  set); Windows/Chromium baselines. Update only with `-u` and review the
  diffs. Implementation tickets add selective shots only; the comprehensive
  matrix is FE-UI-016.
- `ui-core`: pure presentation helpers such as minor-unit money formatting;
  `styles/theme.test.ts` parses `theme.css` to assert reference token values,
  dark overrides and WCAG contrast (text 4.5:1, controls/focus 3:1); theme
  controls render accessible, hydration-safe markup (`renderToStaticMarkup`
  with a mocked `next-themes`).
- `public-ui`: static markup tests (`components.test.tsx`: active link,
  plan card naming, decorative product shot, legal switch) and browser tests
  for the marketing menu (focus trap/return, Escape, link choice, closing at
  `lg`, dark mode) and the pricing interval switch.
- `dashboard-ui`: active-route resolution (`navigation.test.ts`), sidebar
  grouping/rail rendering and `AuthLayout` structure via
  `renderToStaticMarkup`; browser tests
  (`dashboard-shell.browser.test.tsx`) cover the drawer (focus trap/return,
  Escape, scrim, nav selection, scroll lock, closing at `lg`), rail tooltips
  and names, account-menu keyboard use, theme switching, breakpoints and
  print media (chrome hidden only with `data-print-paper`). `BillingDocument`
  browser tests cover light paper in the dark theme, print layout and phone
  overflow. The User and Admin Portal browser suites compose every named
  invoice/receipt preview state in the dashboard shell (desktop/phone,
  light/dark, print); FE-UI-016 reuses those states. Print media is emulated
  through CDP, and computed styles are read with `expect.poll` because the
  Tailwind stylesheet can update after render.
- applications: rendering via `renderToStaticMarkup` with mocked hooks (no DOM
  runner in apps; portalled Radix overlays do not server-render, so app tests
  assert dialog content through a stand-in and dialog semantics are covered
  in `ui-core`), BFF Route Handlers, session/cookie adapters, sign-in/logout, authorization,
  registration/profile/password helpers, navigation, environment, and portal
  configuration. Auth forms are rendered statically per state (headings,
  supported methods, omitted design-only controls, links keeping `returnTo`);
  status-to-alert mapping is tested as pure functions. Apps with interactive
  feature compositions also have a browser config
  (`vitest.browser.config.ts`, `*.browser.test.tsx`, `pnpm test:component`)
  for form input, confirmation lifecycles, pending/duplicate submission and
  stale-data behaviour; a pure-function test is not enough when the rendered
  component could still expose stale state. Feature tests live beside their
  feature (`features/<feature>/*.test.tsx`); shared feature-composition
  helpers keep their own tests, and cross-feature boundary checks (fixture
  imports, unpublished routes) live in one named test such as
  `features/admin-preview-boundaries.test.ts`. Controlled screens are
  exercised in browser tests through a state-owning harness.

Conventions: shared components get component tests and representative
workbench stories; shared layouts get component tests and selective stories;
feature pages are tested in their apps (no workbench duplication); API
integration gets functional/integration tests, not stories or screenshots.
The workbench is never a parallel copy of portal screens.

Browser suites are not part of `pnpm test` or CI until OD-05 adds
browser-capable jobs; run `pnpm test:component` and `pnpm test:visual` locally
(after `pnpm --filter @template/ui-core exec playwright install chromium`) when
changing shared UI, and report the results in the PR. App journeys, theme
persistence and pre-paint theme application still need manual browser checks
(`/foundations`, representative pages).

When changing transport, auth concurrency, serialization, package exports, BFF
routing, or validation mapping, add boundary-focused regression tests. Prefer
injected fetch/clock/location/client dependencies and deterministic unit tests.
Keep interactive workflow logic (for example checkout submission and idempotency
key reuse) in pure modules so it can be tested without a DOM.
Run a filtered workspace test while iterating, then the repository test suite;
architectural/shared changes also require the full verification sequence.
