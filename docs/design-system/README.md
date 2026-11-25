# Design system integration (FE-UI-001)

This folder is the planning foundation for the UI redesign of the three portals against the Project Template design system. It records which design revision is authoritative, what every reference screen is, how it maps to routes and existing functionality, the target presentation architecture, and the order in which later FE-UI tickets implement it.

FE-UI-001 is documentation only: no application, package or configuration code was changed.

## Pinned design source

| Item           | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| Repository     | https://github.com/chukwuemekanweke/Project-Template-Design-System                  |
| Branch         | `main`                                                                              |
| Commit         | `d23eb85fbebd2bccbf038a2050a2a5bf82236076` (2026-11-25)                             |
| Files examined | 563 (307 canonical static screens, 239 editable artboards, 17 bundle/support files) |
| Discovered on  | 2026-11-25                                                                          |

Always read designs at this commit, not the moving `main` branch. The canonical source is the five numbered directories (`0-foundations` … `4-admin-portal`); each canonical file carries the full token stylesheet inline. Details, per-file git blob ids and equivalence checks: [`design-source-manifest.json`](./design-source-manifest.json).

## Documents

| Document                                                   | Use it for                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`screen-inventory.json`](./screen-inventory.json)         | **Start here when implementing a screen.** Machine-readable record per logical screen: reference files and variants, route, implementation files, backend operations, gaps, discrepancies, priority, ticket. |
| [`screen-inventory.md`](./screen-inventory.md)             | Human-readable view of the same inventory, with statistics.                                                                                                                                                  |
| [`migration-roadmap.md`](./migration-roadmap.md)           | **Start here when planning.** Ticket sequence FE-UI-002 … 032 with prerequisites, risks and completion criteria.                                                                                             |
| [`route-mapping.md`](./route-mapping.md)                   | Existing vs proposed routes per app, guard rules, navigation changes, live routes without designs.                                                                                                           |
| [`target-ui-architecture.md`](./target-ui-architecture.md) | The ideal presentation architecture for the design system, defined independently of the current UI.                                                                                                          |
| [`existing-ui-assessment.md`](./existing-ui-assessment.md) | RETAIN / REFACTOR / REPLACE / REMOVE / INTRODUCE verdicts for current packages, components and dependencies.                                                                                                 |
| [`technology-decisions.md`](./technology-decisions.md)     | Decisions TD-01 … TD-20 with requirements, alternatives, trade-offs and migration cost.                                                                                                                      |
| [`component-inventory.md`](./component-inventory.md)       | Every reusable design pattern → owning package and reuse/extend/new decision.                                                                                                                                |
| [`token-mapping.md`](./token-mapping.md)                   | Reference token values, current equivalents, proposed semantic tokens, contrast results.                                                                                                                     |
| [`shared-components.md`](./shared-components.md)           | **Start here when building UI.** Implemented shared components (Trello FE-UI-003): ownership, APIs, variants, states, server/client boundaries, compatibility APIs, workbench and browser tests.             |
| [`foundations.md`](./foundations.md)                       | How to use, extend and rebrand the implemented tokens, fonts, theme provider/controls and assets; legacy aliases; accessibility decisions.                                                                   |
| [`integration-strategy.md`](./integration-strategy.md)     | Rules for implementers: adoption rules, screen procedure, responsive and theme rules, UI states, fixtures and previews.                                                                                      |
| [`verification-strategy.md`](./verification-strategy.md)   | Component, visual, functional and accessibility verification; definition of done.                                                                                                                            |
| [`discrepancy-register.md`](./discrepancy-register.md)     | Confirmed gaps, conflicts, risks (DR-xxx) and open decisions (OD-xx).                                                                                                                                        |

## Key findings

- **58 logical screens** from 62 artboards and 307 reference files: 15 implemented, 13 partial, 28 missing, 2 reference-only.
- The **user portal's live journeys** (auth, profile, security, billing) map onto the reference with presentation changes; their logic must be preserved.
- **Most admin screens and the wallet/KYC screens are backend-gated**: the handwritten `api-client` has no admin, KYC or wallet-balance operations.
- **Password recovery is designed and supported by the backend but has no UI**, which makes it the most valuable unblocked new screen.
- The target architecture keeps the four UI packages but replaces their contents. It adds semantic CSS-variable tokens in `@template/ui-core/theme.css`, Radix primitives, Lucide icons and `next-themes` everywhere, plus a Storybook/Playwright verification harness. It drops TailAdmin's and Solid's visual layer and `framer-motion`.

## How implementation agents should use this folder

1. Find your ticket in [`migration-roadmap.md`](./migration-roadmap.md) and its screens in `screen-inventory.json` (`roadmapTicket`).
2. Read the screen records: reference files (open them at the pinned commit), states, operations, `uiGaps`, `discrepancies`.
3. Follow [`integration-strategy.md`](./integration-strategy.md) and the definition of done in [`verification-strategy.md`](./verification-strategy.md).
4. Do not rediscover the design repository. If the design changes, pin the new commit in the manifest and diff only the affected files.
5. Keep these documents current: update the screen record, the register and the component inventory as part of each ticket. `screen-inventory.json` is authoritative over the Markdown views.

Durable architectural rules from this work are summarised in OKF (`.okf/knowledge/architecture/ui-composition.md`, `.okf/knowledge/architecture/design-system-integration.md`); this folder holds the detail.
