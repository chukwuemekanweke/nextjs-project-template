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
- `ui-core` and `forms` browser tests (`*.browser.test.tsx`, Vitest browser
  mode with Playwright Chromium and reduced motion, `pnpm test:component`):
  keyboard and focus (dialog trap/return, tabs, switch, segmented control,
  OTP), ARIA state, label/hint/error association, loading/duplicate-submit
  prevention, responsive `DataTable`, and React Hook Form integration. The
  node config excludes them.
- Visual regression (`pnpm test:visual`, `tooling/ui-workbench/visual`):
  `toMatchScreenshot` over composed workbench stories at 1440/390 × light/
  dark plus open dialogs; Windows/Chromium baselines. Update only with `-u`
  and review the diffs.
- `ui-core`: pure presentation helpers such as minor-unit money formatting;
  `styles/theme.test.ts` parses `theme.css` to assert reference token values,
  dark overrides and WCAG contrast (text 4.5:1, controls/focus 3:1); theme
  controls render accessible, hydration-safe markup (`renderToStaticMarkup`
  with a mocked `next-themes`).
- `dashboard-ui`: sidebar active-state matching and expanded/collapsed
  navigation rendering via `renderToStaticMarkup`.
- applications: rendering via `renderToStaticMarkup` with mocked hooks (no DOM
  runner in apps; portalled Radix overlays do not server-render, so app tests
  assert dialog content through a stand-in and dialog semantics are covered
  in `ui-core`), BFF Route Handlers, session/cookie adapters, sign-in/logout, authorization,
  registration/profile/password helpers, navigation, environment, and portal
  configuration.

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
