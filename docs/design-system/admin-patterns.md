# Admin patterns

Admin-only feature patterns added by Trello FE-UI-012 (design `ad9386e`,
`4-admin-portal/AdminDashboard*`, `AdminForbidden*`, `AdminStepUp*`). FE-UI-013,
FE-UI-014 and FE-UI-015 build their screens from these instead of new
abstractions. Generic primitives stay in `@template/ui-core` and
`@template/dashboard-ui`; these files only compose them.

```ts
import {
  AdminChartSection,
  AdminDetailHeader,
  AdminFilterBar,
  AdminForbidden,
  AdminKpiCard,
  AdminKpiGrid,
  AdminListCard,
  AdminRangeFilter,
  AdminStepUpDialog,
  AdminSummaryCard,
  AdminSummaryGrid,
  countMetric,
  forbiddenDetailsFromError,
  moneyMetric,
} from "@/components/admin-patterns";
```

All live in `apps/admin-portal/src/components/admin-patterns/`.

## Rules

- Every panel takes a typed state: `ready`, `loading`, `unavailable` (no
  source: a reason, never zero or a sample value), `error` (safe message),
  and `empty` where a list or chart can legitimately be empty.
- Only real, wired reads produce `ready`. Reference figures, providers,
  permission names and dates belong in `*.fixtures.ts` files imported by tests
  only (see `app/_dashboard/admin-dashboard-preview.fixtures.ts` and its import
  guard test).
- Links and actions render only for implemented routes and real backend
  operations. Add the navigation item in `src/config/navigation.ts` with its
  route (the navigation test requires a `page.tsx`).
- The patterns never call APIs, verify codes or decide access. Pages own data
  loading, URL state and mutations.

## Contracts

| File                      | Exports                                                                                                                                                                                           | Notes                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin-metric.ts`         | `AdminMetric`, `AdminMetricDelta`, `countMetric`, `moneyMetric`                                                                                                                                   | `countMetric(null)` and `moneyMetric(amount, null)` are `unavailable`; a real `0` is `ready`.                                                                              |
| `kpi-card.tsx`            | `AdminKpiCard({ label, metric, icon?, unavailableLabel? })`, `AdminKpiGrid`                                                                                                                       | Reference `.stat`; 1 → 2 → 4 columns.                                                                                                                                      |
| `chart-section.tsx`       | `AdminChartSection({ title, kind: "line" \| "bars", data, formatValue?, actions?, onRetry? })`, `AdminChartData`                                                                                  | Wraps `ChartFrame`; ready data needs `categories`, `series` (`values` with `null` gaps) and a text `summary`; adds a visually hidden data table. No chart library (TD-10). |
| `summary-card.tsx`        | `AdminSummaryCard({ title, data, action?, onRetry? })`, `AdminSummaryGrid`, `AdminSummaryRow`                                                                                                     | Label/value rows, optional badge display; `action` shows only with ready data.                                                                                             |
| `filter-bar.tsx`          | `AdminFilterBar({ label, children })`, `AdminRangeFilter({ value, onChange?, range?, disabled?, disabledReason? })`                                                                               | Controlled. No `onChange` (or `disabled`) renders an inert select with its reason.                                                                                         |
| `utc-range.ts`            | `AdminRangePreset`, `parseAdminRangePreset`, `resolveUtcRange`, `formatUtcRange`                                                                                                                  | Whole inclusive UTC days; labels end in "(UTC)". Parse query params with `parseAdminRangePreset`.                                                                          |
| `list-detail.tsx`         | `AdminListCard({ title, toolbar?, actions?, footer?, children })`, `AdminDetailHeader({ title, back?, badges?, meta?, leading?, actions? })`                                                      | Put `DataTable variant="embedded"` in the list card and `Pager` in its footer; statuses use `Badge` with an app-local status → tone map.                                   |
| `admin-read-state.ts`     | `AdminListState`, `AdminListPage`, `AdminDetailState`, `AdminSection`, `AdminOption(s)State`, `readyAdminOptions`, `isAdminOptionAvailable`, `adminOptionsUnavailableText`, `isPageBeyondResults` | Typed read states for every admin list, detail, section and option source. `unavailable` carries its reason.                                                               |
| `admin-states.tsx`        | `AdminListTable`, `AdminListPager`, `AdminSectionBody`, `AdminDetailFallback`                                                                                                                     | List body (embedded `DataTable`) and `AdminListCard` footer (`Pager` or range text). A page past the results offers "Back to first page".                                  |
| `admin-dates.ts`          | `parseAdminTimestamp`, `formatAdminDateTime`, `formatAdminDate`                                                                                                                                   | UTC with a "UTC" label. Timestamps must be zone-qualified (`Z`/offset); calendar dates (`2026-12-14`) are shown as written.                                                |
| `admin-values.tsx`        | `AdminNotAvailable`, `AdminDateTime`, `AdminUnavailableHint`, `ADMIN_ACTION_UNAVAILABLE`, `ADMIN_FILTERS_UNAVAILABLE`                                                                             | One missing-value presentation (dash + "Not available" for assistive technology) and one disabled-action hint.                                                             |
| `admin-status.ts`         | `AdminBadge`, `lookupAdminBadge`, `UNKNOWN_ADMIN_BADGE`                                                                                                                                           | Features own their status → badge maps; the lookup accepts only own keys, so `constructor`/`__proto__`/empty values get a neutral "Unknown".                               |
| `admin-action-failure.ts` | `describeAdminActionFailure`, `AdminActionFailureCategory`                                                                                                                                        | Safe copy for a rejected privileged action from `ApiError.kind` (authentication, permission, conflict, invalid, temporary, unexpected). Never shows raw errors.            |
| `forbidden.tsx`           | `AdminForbidden({ resourceLabel?, permission?, requestDetails?, backHref?, title? })`                                                                                                             | In-shell 403. Permission text only when the backend names it.                                                                                                              |
| `forbidden-details.ts`    | `forbiddenDetailsFromError(error, { path, occurredAt })`, `formatForbiddenDetails`                                                                                                                | Allow-list: status, path without query/fragment, correlation id, UTC time.                                                                                                 |
| `step-up-dialog.tsx`      | `AdminStepUpDialog({ open, description, action, confirmLabel, onSubmit, onCancel, pending?, error?, reason?, codeLength?, validityHint? })`                                                       | Collects a code (and reason when the contract has one); caller verifies.                                                                                                   |
| `step-up-form.ts`         | `StepUpSubmission`, `StepUpReasonConfig`, `decideStepUpSubmit`, `validateStepUp`                                                                                                                  | Pure rules, unit tested.                                                                                                                                                   |

## Usage

List screen (FE-UI-013 users, FE-UI-014/015 operations):

```tsx
<DashboardHeader title="Users" description="…" />
<AdminListCard
  title="All users"
  toolbar={
    <AdminFilterBar label="User filters">
      <SearchInput aria-label="Search users" value={query} onChange={…} />
    </AdminFilterBar>
  }
  footer={<AdminListPager label="Users pages" state={state} onPageChange={setPage} />}
>
  <AdminListTable caption="Users" state={state} columns={columns} keyField={(row) => row.id} emptyTitle="No users found" loadingLabel="Loading users" onPageChange={setPage} />
</AdminListCard>
```

Detail screen with a step-up action:

```tsx
const [stepUp, setStepUp] = useState(false);
const lock = useLockUser(); // the ticket's real mutation, once the API exists

<AdminDetailHeader
  back={{ href: "/users", label: "All users" }}
  title={user.displayName}
  badges={<Badge tone={statusTone[user.status]}>{statusLabel[user.status]}</Badge>}
  actions={<Button variant="dangerOutline" onClick={() => setStepUp(true)}>Lock account</Button>}
/>
<AdminStepUpDialog
  open={stepUp}
  description="Locking an account needs a fresh authenticator check."
  action={{ title: `Lock ${user.displayName}`, description: "Signs the user out everywhere and blocks sign-in until unlocked." }}
  confirmLabel="Lock account"
  reason={{ label: "Reason (recorded in audit history)", required: true }} // only if the API takes one
  pending={lock.isPending}
  error={lock.error ? safeStepUpMessage(lock.error) : null}
  onCancel={() => setStepUp(false)}
  onSubmit={(input) => lock.mutate({ userId, ...input }, { onSuccess: () => setStepUp(false) })}
/>
```

Forbidden state when a backend read returns 403 inside an admitted session:

```tsx
const details = forbiddenDetailsFromError(error, {
  path: pathname,
  occurredAt: new Date().toISOString(),
});
if (details)
  return <AdminForbidden resourceLabel="Users" requestDetails={details} />;
```

Privileged actions: capture the target record's identity (and any role or
session id) in the confirmation state when the dialog opens, build the final
intent from that captured target, and dismiss the confirmation if the
displayed record changes or the action is no longer allowed. Show failures
with `describeAdminActionFailure`; never report success the backend did not
confirm. Use `AdminStepUpDialog` only where the preview assumes step-up
(DR-072) and `ConfirmDialog` otherwise; the final policy is the backend's.

## Extension points and limits

- Charts: add a `kind` only when a screen needs it; replace the inline SVG
  with Recharts when TD-10 is decided, keeping `AdminChartData`.
- Range filter: wire `onChange` to URL search params when an analytics API
  accepts a period; keep the disabled state otherwise. Custom ranges need a
  date-picker decision first.
- Forbidden: there is no live consumer yet. The proxy redirects sessions
  without the admin role to `/sign-in` and the sign-in BFF returns 403 there,
  so the in-shell state applies only to backend 403s on admin reads, which do
  not exist yet (DR-070, DR-073). `/` has no backend reads, so "Back to
  dashboard" cannot loop.
- Step-up: no step-up endpoint or admin MFA exists (DR-041, DR-072). Do not
  show a validity window, permission names or success until the backend
  contract defines them; `validityHint` exists for that copy.
- Tables: use `DataTable` (through `AdminListTable` for lists). A matrix that
  needs row headers and group headings spanning every column (the FE-UI-013
  permission matrix, `features/admin-roles/permission-matrix.tsx`) stays a
  specialised accessible `<table>` with `scope` headers rather than bending
  `DataTable`.
- Do not move these into `packages/*` unless a second portal needs them.
