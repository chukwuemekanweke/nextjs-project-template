import {
  Button,
  Card,
  CardContent,
  DataTable,
  EmptyState,
  ErrorState,
  InboxIcon,
  LoadingStatus,
  Pager,
  Skeleton,
  describePageRange,
  type DataTableMobileLayout,
  type TableColumn,
} from "@template/ui-core";
import type { ReactNode } from "react";
import { AdminForbidden } from "./forbidden";
import {
  isPageBeyondResults,
  type AdminDetailState,
  type AdminListState,
  type AdminSection,
} from "./admin-read-state";

/*
 * State presentation for admin lists, details and sections. Loading,
 * error, unavailable and empty are always distinct: an unavailable source
 * never reads as "no results".
 *
 * List composition:
 *   <AdminListCard title toolbar={<AdminFilterBar …/>}
 *     footer={<AdminListPager state={state} onPageChange={…} />}>
 *     <AdminListTable state={state} columns={…} … />
 *   </AdminListCard>
 */

function UnavailableMessage({ reason }: Readonly<{ reason: string }>) {
  return (
    <div className="grid justify-items-center gap-1" data-state="unavailable">
      <p className="text-fg font-semibold">Not available</p>
      <p className="text-small text-fg-muted max-w-md">{reason}</p>
    </div>
  );
}

/**
 * The embedded `DataTable` for a list state. A ready page past the last
 * result (rows removed since it was requested) offers "Back to first page"
 * when the caller can change pages.
 */
export function AdminListTable<Row>({
  caption,
  columns,
  emptyDescription,
  emptyTitle,
  keyField,
  loadingLabel,
  mobileLayout = "stack",
  onPageChange,
  onRetry,
  state,
}: Readonly<{
  caption: string;
  columns: readonly TableColumn<Row>[];
  emptyDescription?: ReactNode;
  emptyTitle: string;
  keyField: (row: Row) => string;
  loadingLabel: string;
  mobileLayout?: DataTableMobileLayout;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  /** Screens render `AdminForbidden` themselves for `forbidden`. */
  state: Exclude<AdminListState<Row>, { state: "forbidden" }>;
}>) {
  let error: ReactNode;
  if (state.state === "error") {
    error = (
      <ErrorState
        className="py-2"
        description={
          state.message ?? "Please try again. If it continues, contact support."
        }
        onRetry={onRetry}
        title="Couldn't load this list"
      />
    );
  } else if (state.state === "unavailable") {
    error = <UnavailableMessage reason={state.reason} />;
  }

  let empty = (
    <EmptyState
      className="border-0 py-2"
      description={emptyDescription}
      icon={<InboxIcon />}
      title={emptyTitle}
    />
  );
  if (state.state === "ready" && isPageBeyondResults(state)) {
    empty = (
      <EmptyState
        action={
          onPageChange ? (
            <Button
              onClick={() => onPageChange(1)}
              size="sm"
              variant="secondary"
            >
              Back to first page
            </Button>
          ) : undefined
        }
        className="border-0 py-2"
        description="The results may have changed since this page was requested."
        icon={<InboxIcon />}
        title="No results on this page"
      />
    );
  }

  return (
    <DataTable
      caption={caption}
      columns={columns}
      empty={empty}
      error={error}
      keyField={keyField}
      loading={state.state === "loading"}
      loadingLabel={loadingLabel}
      mobileLayout={mobileLayout}
      rows={state.state === "ready" ? state.rows : []}
      variant="embedded"
    />
  );
}

/**
 * `AdminListCard` footer for a list state: the `Pager` when the caller can
 * change pages, otherwise the range text. Nothing for non-ready states or a
 * first page without results. Pass the result to `footer` as is.
 */
export function AdminListPager({
  getHref,
  label,
  loading = false,
  onPageChange,
  state,
}: Readonly<{
  getHref?: (page: number) => string;
  /** Accessible name, for example "Users pages". */
  label: string;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  state: AdminListState<unknown>;
}>) {
  if (state.state !== "ready") {
    return null;
  }
  if (state.rows.length === 0 && state.page <= 1) {
    return null;
  }
  if (!onPageChange && !getHref) {
    return (
      <p className="text-label text-fg-muted">
        {describePageRange({
          page: state.page,
          pageSize: state.pageSize,
          totalItems: state.totalItems,
          totalPages: state.totalPages,
        })}
      </p>
    );
  }
  return (
    <Pager
      className="w-full border-t-0 p-0 md:p-0"
      getHref={getHref}
      label={label}
      loading={loading}
      onPageChange={onPageChange}
      page={state.page}
      pageSize={state.pageSize}
      totalItems={state.totalItems}
      totalPages={Math.max(state.totalPages, state.page)}
    />
  );
}

/**
 * Body of an independently loaded card: skeleton, error, "Not available"
 * with its reason, or the ready content.
 */
export function AdminSectionBody<T>({
  children,
  label,
  onRetry,
  section,
}: Readonly<{
  children: (data: T) => ReactNode;
  /** Lower-case region name, for example "active sessions". */
  label: string;
  onRetry?: () => void;
  section: AdminSection<T>;
}>) {
  switch (section.state) {
    case "loading":
      return (
        <div aria-busy="true" className="grid gap-3">
          <LoadingStatus label={`Loading ${label}`} />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      );
    case "error":
      return (
        <ErrorState
          className="px-0 py-2"
          description={section.message ?? `The ${label} could not be loaded.`}
          onRetry={onRetry}
          title={`Couldn't load ${label}`}
        />
      );
    case "unavailable":
      return (
        <div data-state="unavailable">
          <p className="text-fg-muted font-medium">Not available</p>
          <p className="text-small text-fg-subtle mt-0.5">{section.reason}</p>
        </div>
      );
    case "ready":
      return <>{children(section.data)}</>;
  }
}

/**
 * Non-ready detail states (forbidden, loading, error, not found,
 * unavailable). Returns `null` for `ready` so the caller renders the record.
 */
export function AdminDetailFallback<Item>({
  backLink,
  onRetry,
  resourceLabel,
  state,
}: Readonly<{
  /** Link back to an implemented list route, when one exists. */
  backLink?: ReactNode;
  onRetry?: () => void;
  /** Singular, capitalised, for example "Payment". */
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
            <Skeleton className="h-8 w-60 max-w-full" />
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
        <Card data-state="unavailable">
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
