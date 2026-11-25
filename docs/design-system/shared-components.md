# Shared components

The shared component foundation delivered by Trello **FE-UI-003 — Redesign shared UI primitives and component states**. In the older roadmap numbering ([DR-077](./discrepancy-register.md#dr-077)) this covers most of FE-UI-004 (core primitives and icons), FE-UI-005 (overlays and interactive controls), FE-UI-006 (data display), the presentational half of FE-UI-007 (form controls) and a local-only part of FE-UI-002 (verification harness). Reference: `0-foundations/Main.html` and the component classes in the pinned `theme.css` (`d23eb85`).

Screen tickets should compose these components; they should not re-implement buttons, fields, dialogs, tables, badges or loading/empty/error states.

## 1. Ownership

| Package                         | Owns                                                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@template/ui-core`             | `cn`/`joinIds`, Lucide icon set, actions, indicators, surfaces, form controls, overlays, tabs, `DataTable`, `Pager`, alerts and async states. No React Hook Form, Zod or API code. |
| `@template/forms`               | Connected fields (`TextField`, `PasswordField`, `ConfirmationCodeField`, `SearchableSelectField`, `SubmitButton`) rendered with `ui-core` controls.                                |
| `@template/dashboard-ui/charts` | Chart foundations: `ChartFrame`, `ChartLegend`, `chartSeriesColor`, `chartColors`. Subpath export so user/public bundles stay chart-free.                                          |
| `apps/*`                        | Domain → tone mapping (payment, subscription, session status), copy, data fetching, pagination state, retry and every workflow.                                                    |
| `tooling/ui-workbench`          | Storybook previews, typed preview fixtures, visual-regression baselines. Private; never deployed or imported by apps.                                                              |

## 2. Conventions

- **Styling.** Semantic tokens only (`bg-surface`, `text-fg-muted`, `border-border`, `bg-brand`, `bg-success-bg text-success`, `text-tab-active-fg`). No hex values and no `dark:` colour pairs: themes swap tokens under `.dark`. Variants use `class-variance-authority` next to the component (`buttonVariants`, `badgeVariants`, `iconButtonVariants`, `iconTileVariants`); there is no global variant registry.
- **Class overrides.** Every component accepts `className` merged last through `cn()` (`clsx` + `tailwind-merge`, configured with the theme's custom `text-*`, spacing, container and `z-*` names), so consumer classes win predictably.
- **Refs.** React 19 ref-as-prop: controls accept `ref` directly (works with `register()`).
- **Server/client boundary.** Static primitives have no `"use client"` and render from Server Components: `Button` (without `loading`/`onClick`), `IconButton`, `Badge`, `Chip` (without `onRemove`), `IconTile`, `Progress`, `Spinner`, `Divider`, `Card*`, `Panel`, `Stat*`, `KeyValueList`, `ListRow`, `Skeleton*`, `EmptyState`, `ErrorState` (without `onRetry`), all of `form.tsx`, `DataTable`, `Pager` (with `getHref`), `Pagination`. Client modules: `Alert`, `Avatar`, `Dialog`/`ConfirmDialog`/`Modal`, `Tabs`, `Switch`, `SegmentedControl`, `PasswordInput`, `OtpInput`, theme controls. Lucide glyphs are client components rendered from the server without props that need serialisation.
- **Radix.** Behaviour only (Dialog, Tabs, Switch, ToggleGroup, Slot) from the unified `radix-ui` package; styling and component contracts stay in the repository. Native elements are preferred where they meet the need (checkbox, radio, select, inputs).
- **Motion.** CSS only. Dialog entry uses `animate-overlay-in` / `animate-dialog-in` / `animate-sheet-in`; spinners and skeletons use `motion-safe:`. The base layer disables animation under `prefers-reduced-motion`.

## 3. Components

### Actions

| Component                      | Variants and states                                                                                                                                                  | Notes                                                                                                                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`, `buttonVariants`     | `primary`, `secondary`, `ghost`, `danger`, `dangerOutline`; sizes `default` (44px) and `sm` (36px); `fullWidth`; `leadingIcon` / `trailingIcon`; disabled; `loading` | `type="button"` by default. `loading` shows a spinner, sets `aria-busy`/`aria-disabled` and swallows clicks (including implicit form submission) while staying focusable. `asChild` renders a single child link with button styles (no nested interactive elements). |
| `IconButton`                   | `secondary` (bordered, reference `.icon-btn`), `ghost`; sizes `default` 44px, `sm` 36px                                                                              | `label` is required and becomes the accessible name and tooltip.                                                                                                                                                                                                     |
| `buttonClassName` (deprecated) | legacy `primary`, `secondary`, `accent`, `destructive`, `danger`; `sm`/`md`                                                                                          | Backed by `buttonVariants`: `destructive` → `dangerOutline`, `danger` → `danger`, `accent` → `secondary` ([DR-078](./discrepancy-register.md#dr-078)).                                                                                                               |

### Indicators

| Component           | Variants and states                                                            | Notes                                                                                               |
| ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `Badge`             | tones `neutral`, `success`, `warning`, `danger`, `info`; `dot` (default on)    | Text carries meaning. `StatusBadge` (deprecated) renders `Badge`; `StatusTone` = `BadgeTone`.       |
| `Chip`              | static; removable (`onRemove` + `removeLabel`)                                 | Reference `.chip`.                                                                                  |
| `Avatar`            | `sm` 32, `md` 40, `lg` 88; image or initials                                   | `role="img"` named by `name`; failed images fall back to initials; `decorative` hides it.           |
| `IconTile`          | tones `brand`, `neutral`, `success`, `warning`, `danger`; sizes `sm`/`md`/`lg` | Decorative. `IconContainer` (deprecated) renders it.                                                |
| `Progress`          | tones `brand`, `success`, `warning`, `danger`                                  | `role="progressbar"`, required `label`, optional `valueText`.                                       |
| `Spinner`           | `sm`/`md`/`lg`; standalone or `decorative`                                     | Standalone is a polite `role="status"` with a label.                                                |
| `Divider`           | horizontal, vertical, labelled ("or")                                          | Reference `.divider`, `.or`.                                                                        |
| Icons (`icons.tsx`) | 60+ curated Lucide icons; `size` presets `xs` 16, `sm` 18, `md` 20, `lg` 22    | Always `aria-hidden`; 1.8 stroke; `data-icon` names the icon. Legacy names kept (now Lucide-drawn). |

### Surfaces

`Card`, `CardHeader` (bordered, title left / actions right), `CardTitle` (`as` h2–h4, 16px), `CardDescription`, `CardContent` (`p-card`: 16px phone, 24px desktop), `CardFooter` (right-aligned; buttons share width on phones), `Panel` (reference `.soft`), `Stat` + `StatGrid` (two columns and no icon on phones; delta text states direction, icon/colour reinforce), `KeyValueList` (`<dl>`, stacks on phones), `ListRow` (leading, title, description, meta, actions; `as="li"`). `StatCard`, `SectionHeader`, `SettingsRow` remain as deprecated, token-styled compositions.

### Form controls (`ui-core`)

| Component                                           | States                                                                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `Input`, `Select`, `Textarea`                       | default, hover, focus (brand border + ring), filled, placeholder, read-only (`[readonly]`), disabled, invalid (`aria-invalid`)                 |
| `SearchInput`                                       | as `Input`, `type="search"` with a decorative icon; needs `aria-label` or a label                                                              |
| `PasswordInput`                                     | show/hide `aria-pressed` toggle (labels configurable)                                                                                          |
| `OtpInput`                                          | controlled boxes; typing advances, Backspace steps back, arrows move, paste/autofill fills; `one-time-code` on box 1; optional group separator |
| `Checkbox`, `Radio`                                 | native; optional `label` and `description` (linked via `aria-describedby`); disabled                                                           |
| `RadioGroup`, `RadioCard`                           | `fieldset`/`legend`; error linked to the group; card highlights when checked and shows keyboard focus                                          |
| `Switch`                                            | Radix `role="switch"`; 44px hit area; disabled; hidden input with `name`                                                                       |
| `SegmentedControl`                                  | Radix ToggleGroup (single); always one value; controlled or uncontrolled; scrolls on narrow screens                                            |
| `FormField`, `FormLabel`, `FieldHint`, `FieldError` | label association, required marker (`aria-hidden` `*`, native `required` carries semantics), hint or error (`role="alert"`, icon + text)       |

Controls are 44px tall. Form-control borders use `--color-control-border` (≥ 3:1, DR-029); buttons keep the reference `border-strong` because their text identifies them.

### Overlays and navigation

- **`Dialog`** — Radix Dialog in a portal: labelled by `title`, described by `description`, focus trapped and returned to the previously focused element (even without a Radix trigger), background inert, scroll locked. Escape and the close button dismiss when `dismissible` (default); **scrim clicks never dismiss** ([DR-080](./discrepancy-register.md#dr-080)). Desktop: 520px (`compact` 440px) card 96px from the top; phones: bottom sheet with 16px margins. Body scrolls; header and footer stay. Footer buttons share width on phones.
- **`ConfirmDialog`** — destructive or primary confirmation; while `pending`, cancel is disabled, confirm shows a spinner and the dialog cannot be dismissed. It never closes itself on confirm.
- **`Modal`** (deprecated) — original props on `Dialog`. `onClose` runs from the close button and now also from Escape; without `onClose` the dialog is not dismissible (existing consumers already pass `undefined` while a request is pending).
- **`Tabs`** — Radix Tabs; same `items` API plus `value`/`onValueChange` (controlled, e.g. `?tab=`) and per-item `disabled`. Automatic activation; brand underline in light, neutral in dark (`--color-tab-active-*`); scrolls horizontally.

### Data and asynchronous states

- **`DataTable<Row>`** — columns (`header`, `cell`, `align` left/right/center, `className`, `id`, `mobileLabel`), `keyField`, `caption` (visually hidden name), states in priority order `error` → `loading` (skeleton rows hidden from AT, `aria-busy`, polite announcement) → empty (`empty` node or `emptyMessage`) → rows. `mobileLayout="scroll"` (default, horizontal scroll) or `"stack"` (labelled blocks below `md`, same cells re-flowed by CSS, explicit table roles, visual labels use `content: attr(data-label) / ""` so they are not announced twice; `mobileLabel: ""` for action columns). `variant="embedded"` drops the border inside a `Card`. No fetching, sorting, filtering or routing.
- **`Pager`** — reference `.pager`: range text ("Showing 11–20 of 42" or "Page 2 of 5", polite live region), Previous/Next with `getHref` (links) or `onPageChange` (buttons); boundaries and `loading` render disabled buttons, never dead links. `describePageRange` is exported. `Pagination` (deprecated) keeps its numbered-link API; disabled boundaries are now inert text.
- **`Alert`** — `info`, `success`, `warning`, `error`; tone icon; optional `title`, `action`, dismissal and auto-dismiss (unchanged behaviour). Errors/warnings `role="alert"`, others `role="status"`.
- **`Skeleton`**, `SkeletonText`, `SkeletonCard`, `SkeletonList`, `LoadingStatus` — decorative blocks plus a polite status label on the composed placeholders.
- **`EmptyState`** (icon, title, description, `action`, `secondaryAction`) and **`ErrorState`** (title, safe default description, `onRetry` with `retrying`, alternative `action`; `role="alert"`). Never pass raw exception text or backend payloads.

### Chart foundations (`@template/dashboard-ui/charts`)

`ChartFrame` (card with title, description, actions, legend, plot area 180px phone / 240px desktop, `state` `ready`/`loading`/`empty`/`error` with retry, required `summary` used as the figure's text alternative), `ChartLegend`, `chartSeriesColor(1–4)` and `chartColors` (`grid`, `axis`, `area`) returning theme-aware CSS variables for SVG. **Deferred (TD-10):** Recharts, chart types (line, bar, donut), axes and tooltips, data-table alternatives — introduced with the first analytics screen.

## 4. Preview and verification

| Command                | What it does                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm workbench`       | Storybook at `http://localhost:6006`: theme toolbar (light/dark `.dark` class), viewports (390 phone, 834 tablet, 1440 desktop), a11y panel. Stories in `tooling/ui-workbench/src/stories`.                        |
| `pnpm workbench:build` | Static Storybook build (`storybook-static/`, ignored).                                                                                                                                                             |
| `pnpm test:component`  | Vitest browser mode (Chromium via Playwright, reduced motion) for `ui-core` and `forms` `*.browser.test.tsx`: keyboard, focus trap/return, ARIA state, label/error association, responsive table, RHF integration. |
| `pnpm test:visual`     | Screenshots the workbench galleries (desktop/phone × light/dark) and open dialogs; baselines in `tooling/ui-workbench/visual/__screenshots__`. Update with `pnpm test:visual -- -u` and review the diffs.          |

One-time setup: `pnpm --filter @template/ui-core exec playwright install chromium`. These suites are **not** part of `pnpm test` or CI yet (OD-05); see [verification-strategy.md §8](./verification-strategy.md#8-implementation-status).

Preview fixtures live in `tooling/ui-workbench/src/stories/__fixtures__/`, are typed, and are deliberately generic (team members, an illustrative series): no payments, balances, identity, authentication or security outcomes are simulated.
