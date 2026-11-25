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
- `ui-core`: pure presentation helpers such as minor-unit money formatting;
  `styles/theme.test.ts` parses `theme.css` to assert reference token values,
  dark overrides and WCAG contrast (text 4.5:1, controls/focus 3:1); theme
  controls render accessible, hydration-safe markup (`renderToStaticMarkup`
  with a mocked `next-themes`).
- `dashboard-ui`: sidebar active-state matching and expanded/collapsed
  navigation rendering via `renderToStaticMarkup`.
- applications: rendering via `renderToStaticMarkup` with mocked hooks (no DOM
  or browser runner exists), BFF Route Handlers, session/cookie adapters, sign-in/logout, authorization,
  registration/profile/password helpers, navigation, environment, and portal
  configuration.

Theme persistence, pre-paint theme application and visual checks have no
browser runner yet (roadmap harness, OD-05); verify them manually in a
browser against `/foundations` (public portal, dev only) and representative
pages, and say so in the PR.

When changing transport, auth concurrency, serialization, package exports, BFF
routing, or validation mapping, add boundary-focused regression tests. Prefer
injected fetch/clock/location/client dependencies and deterministic unit tests.
Keep interactive workflow logic (for example checkout submission and idempotency
key reuse) in pure modules so it can be tested without a DOM.
Run a filtered workspace test while iterating, then the repository test suite;
architectural/shared changes also require the full verification sequence.
