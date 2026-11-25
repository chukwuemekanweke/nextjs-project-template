---
type: architecture
title: Design System Integration
description: Pinned design source, screen inventory, and rules for FE-UI redesign tickets
resource: okf://knowledge/architecture/design-system-integration
tags: [constraint, architecture, ui, design-system, redesign]
governance: constraint
code_refs:
  [
    docs/design-system/**,
    packages/ui-core/**,
    packages/dashboard-ui/**,
    packages/public-ui/**,
    packages/forms/**,
    apps/*/src/app/**,
    apps/*/src/components/**,
  ]
sources:
  - kind: file
    path: docs/design-system/screen-inventory.json
  - kind: file
    path: docs/design-system/design-source-manifest.json
generated: { at: "2026-11-25T00:00:00Z", by: human }
status: stable
---

The UI is being redesigned design-first against the Project Template design
system, pinned at commit `d23eb85` of
`chukwuemekanweke/Project-Template-Design-System` (canonical files: the
numbered `0-foundations` … `4-admin-portal` directories). Detailed planning
lives in `docs/design-system/`; load it only for UI redesign work.

- Before implementing a screen, read its record in
  `docs/design-system/screen-inventory.json` (reference files, states, route,
  backend operations, gaps, roadmap ticket) instead of rediscovering the design
  repository. Keep the record and `discrepancy-register.md` current.
- The design is the visual specification; the backend is the functional one.
  Never render a field, number, state or action the backend cannot provide, and
  never substitute fixtures or mocks for a real or failing API.
- Visual tickets replace presentation only. Hooks, `apps/*/src/lib/*` view and
  workflow logic, BFF routes, `proxy.ts` guards and form schemas stay unchanged
  unless a separate ticket changes them.
- One responsive route per logical screen: no mobile or dark-mode routes;
  business states are not routes. Screens whose backend does not exist get no
  route or navigation item; they may be previewed only in the UI workbench.
- Fixtures live in `__fixtures__/` beside the view they serve, are typed with
  `api-client` contracts, and may be imported only by stories and tests.
- Target direction (adopted ticket by ticket, see
  `docs/design-system/migration-roadmap.md`): semantic tokens and
  `next-themes` (landed, `design-tokens-theming`); Radix-based primitives,
  Lucide icons, `DataTable`/`Pager` and chart foundations (landed, see
  `ui-components` and `docs/design-system/shared-components.md`); screen
  migrations next.
- Trello card numbers can differ from roadmap IDs (DR-077: Trello FE-UI-002
  delivered roadmap FE-UI-003; Trello FE-UI-003 delivered most of roadmap
  FE-UI-004–006 and the local part of the FE-UI-002 harness — workbench,
  browser-mode and primitive visual tests — while CI wiring, journeys and axe
  automation remain outstanding). Treat the current card as authoritative and record the
  mapping rather than renumbering the roadmap. Existing package ownership rules
  (`ui-composition`, `package-dependency-rules`) remain in force; describe the
  current implementation there as each ticket lands.
