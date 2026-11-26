import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  EmptyState,
  ErrorState,
  FormField,
  InboxIcon,
  LoadingStatus,
  Pager,
  Select,
  Skeleton,
  type ButtonProps,
  type TableColumn,
} from "@template/ui-core";
import { AdminForbidden } from "@/components/admin-patterns";
import {
  UNAVAILABLE_ACTION_DESCRIPTION,
  type AdminDetailState,
  type AdminListState,
  type AdminOption,
  type StatusPresentation,
} from "./billing-model";

/*
 * Building blocks shared by the admin billing screens. They render the state
 * they are given and report intents; they never call APIs, decide access or
 * show an outcome the caller did not supply.
 */

export function BillingStatusBadge({
  status,
}: Readonly<{ status: StatusPresentation }>) {
  return <Badge tone={status.tone}>{status.label}</Badge>;
}

/** Placeholder for a value the source did not return. */
export function NotAvailable({ label = "Not available" }: { label?: string }) {
  return <span className="text-fg-subtle">{label}</span>;
}

/**
 * A button that reports one intent. Without `onAction` it renders disabled
 * and is described by a visible hint, so the screen never pretends an
 * operation exists.
 */
export function IntentButton({
  busy = false,
  children,
  hintId,
  intent,
  onAction,
  ...props
}: Omit<ButtonProps, "onClick" | "disabled"> &
  Readonly<{
    busy?: boolean;
    children: ReactNode;
    /** Id of the visible unavailable hint (see `UnavailableActionHint`). */
    hintId?: string;
    intent: string;
    onAction?: () => void;
  }>) {
  const unavailable = !onAction;
  return (
    <Button
      {...props}
      aria-describedby={unavailable ? hintId : undefined}
      data-intent={intent}
      disabled={unavailable || busy}
      loading={busy}
      onClick={onAction}
      type="button"
    >
      {children}
    </Button>
  );
}

export function UnavailableActionHint({
  children = UNAVAILABLE_ACTION_DESCRIPTION,
  id,
}: Readonly<{ children?: ReactNode; id: string }>) {
  return (
    <p className="text-small text-fg-subtle" id={id}>
      {children}
    </p>
  );
}

/**
 * Filter select. Controlled by the caller; inert (with its reason) when there
 * is no change handler or no options source.
 */
export function FilterSelect({
  anyLabel = "Any",
  disabledReason,
  id,
  label,
  onChange,
  options,
  value,
}: Readonly<{
  anyLabel?: string;
  disabledReason?: string;
  id: string;
  label: string;
  onChange?: (value: string) => void;
  options: readonly AdminOption[];
  value: string;
}>) {
  const inert = !onChange || Boolean(disabledReason);
  const hintId = `${id}-hint`;
  return (
    <FormField
      className="min-w-[150px] flex-[1_1_150px] md:flex-none"
      descriptionId={inert && disabledReason ? hintId : undefined}
      hint={inert ? disabledReason : undefined}
      inputId={id}
      label={label}
    >
      <Select
        aria-describedby={inert && disabledReason ? hintId : undefined}
        disabled={inert}
        id={id}
        onChange={(event) => onChange?.(event.target.value)}
        value={value}
      >
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

/**
 * Table body and pager for a list state. Loading, error, unavailable and
 * empty are distinct: an unavailable list never reads as "no results".
 */
export function BillingListTable<Row>({
  caption,
  columns,
  emptyDescription,
  emptyTitle,
  keyField,
  loadingLabel,
  onPageChange,
  onRetry,
  paged = true,
  state,
}: Readonly<{
  caption: string;
  columns: readonly TableColumn<Row>[];
  emptyDescription?: string;
  emptyTitle: string;
  keyField: (row: Row) => string;
  loadingLabel: string;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  /** False for short lists the reference shows without a pager. */
  paged?: boolean;
  state: Exclude<AdminListState<Row>, { state: "forbidden" }>;
}>) {
  const rows = state.state === "ready" ? state.rows : [];
  let error: ReactNode;
  if (state.state === "error") {
    error = (
      <ErrorState
        description={
          state.message ?? "Please try again. If it continues, contact support."
        }
        onRetry={onRetry}
        title="Couldn't load this list"
      />
    );
  } else if (state.state === "unavailable") {
    error = (
      <div className="grid justify-items-center gap-1" data-unavailable="">
        <p className="text-fg font-semibold">Not available</p>
        <p className="text-small text-fg-muted max-w-md">{state.reason}</p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        caption={caption}
        columns={columns}
        empty={
          <EmptyState
            description={emptyDescription}
            icon={<InboxIcon />}
            title={emptyTitle}
          />
        }
        error={error}
        keyField={keyField}
        loading={state.state === "loading"}
        loadingLabel={loadingLabel}
        mobileLayout="stack"
        rows={rows}
        variant="embedded"
      />
      {paged && state.state === "ready" && rows.length > 0 ? (
        <Pager
          label={`${caption} pages`}
          onPageChange={onPageChange}
          page={state.page}
          pageSize={state.pageSize}
          totalItems={state.totalItems}
          totalPages={state.totalPages}
        />
      ) : null}
    </>
  );
}

/** One recorded status change; only timestamps the source recorded. */
export type BillingTimelineEvent = Readonly<{
  id: string;
  label: string;
  atUtc: string;
  /** Who or what recorded it, for example "Provider webhook". */
  source?: string;
}>;

export function BillingTimeline({
  events,
  formatAt,
  label,
}: Readonly<{
  events: readonly BillingTimelineEvent[];
  formatAt: (value: string) => string | undefined;
  label: string;
}>) {
  if (events.length === 0) {
    return <p className="text-small text-fg-muted">No recorded changes.</p>;
  }
  return (
    <ol aria-label={label} className="grid gap-4">
      {events.map((event) => {
        const at = formatAt(event.atUtc);
        return (
          <li className="flex gap-3" key={event.id}>
            <span
              aria-hidden="true"
              className="bg-brand mt-1.5 size-2.5 shrink-0 rounded-full"
            />
            <div className="min-w-0">
              <p className="text-small text-fg font-semibold break-words">
                {event.label}
              </p>
              <p className="text-caption text-fg-subtle">
                {at ? (
                  <time dateTime={event.atUtc}>{at}</time>
                ) : (
                  "Time not recorded"
                )}
                {event.source ? ` · ${event.source}` : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Non-ready detail states. Returns `null` for `ready` so the caller renders
 * the record.
 */
export function BillingDetailFallback<Item>({
  backLink,
  onRetry,
  resourceLabel,
  state,
}: Readonly<{
  backLink?: ReactNode;
  onRetry?: () => void;
  resourceLabel: string;
  state: AdminDetailState<Item>;
}>) {
  switch (state.state) {
    case "ready":
      return null;
    case "forbidden":
      return (
        <AdminForbidden
          permission={state.permission}
          requestDetails={state.requestDetails}
          resourceLabel={resourceLabel}
        />
      );
    case "loading":
      return (
        <Card aria-busy="true">
          <CardContent className="grid gap-3">
            <LoadingStatus label={`Loading ${resourceLabel.toLowerCase()}`} />
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      );
    case "error":
      return (
        <Card>
          <ErrorState
            action={backLink}
            description={
              state.message ??
              "Please try again. If it continues, contact support."
            }
            onRetry={onRetry}
            title={`Couldn't load ${resourceLabel.toLowerCase()}`}
          />
        </Card>
      );
    case "notFound":
      return (
        <Card>
          <CardContent>
            <EmptyState
              action={backLink}
              description="It may have been removed, or the link is wrong."
              title={`${resourceLabel} not found`}
            />
          </CardContent>
        </Card>
      );
    case "unavailable":
      return (
        <Card data-unavailable="">
          <CardContent>
            <EmptyState
              action={backLink}
              description={state.reason}
              title={`${resourceLabel} is not available`}
            />
          </CardContent>
        </Card>
      );
  }
}
