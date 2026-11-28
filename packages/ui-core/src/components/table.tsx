import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { LoadingStatus, Skeleton } from "./skeleton";

export type TableColumn<Row> = {
  header: string;
  cell: (row: Row) => ReactNode;
  className?: string;
  /** Horizontal alignment of the header and cells; defaults to `left`. */
  align?: "left" | "right" | "center";
  /** Stable key when two columns share a header; defaults to `header`. */
  id?: string;
  /**
   * Label before the value in the stacked phone layout; defaults to
   * `header`. Use `""` for columns that need no label (row actions).
   */
  mobileLabel?: string;
};

export type DataTableMobileLayout = "scroll" | "stack";

const alignClasses = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

/*
 * Stacked phone layout (reference `.tp.m .tbl`): below `md` each row becomes
 * a block, the first cell is its title, and the other cells show their
 * column label (`data-label`) on the left. The same cells and controls are
 * re-flowed with CSS — never duplicated — and explicit table roles keep the
 * header/cell relationships for screen readers. The visual label is
 * generated content with empty alternative text, so it is not announced
 * twice.
 */
const stackedRow =
  "max-md:block max-md:border-b max-md:border-border max-md:px-4 max-md:py-3.5 max-md:last:border-b-0";
const stackedCell = cn(
  "max-md:flex max-md:flex-wrap max-md:items-center max-md:justify-end max-md:gap-x-2 max-md:gap-y-1.5 max-md:border-0 max-md:px-0 max-md:py-[5px] max-md:text-right",
  "max-md:before:text-caption max-md:before:text-fg-subtle max-md:before:mr-auto max-md:before:text-left max-md:before:font-semibold max-md:before:tracking-[0.04em] max-md:before:uppercase max-md:before:[content:attr(data-label)_/_'']",
  "max-md:data-[label='']:before:hidden",
  "max-md:first:block max-md:first:pt-0 max-md:first:pb-2 max-md:first:text-left max-md:first:before:hidden",
);

/**
 * Presentation-only data table (reference `.tbl`). The application supplies
 * rows, columns, row actions (as cell content) and state; fetching, sorting,
 * filtering and pagination stay in the app.
 *
 * States, in priority order: `error`, `loading` (skeleton rows, `aria-busy`
 * and a polite announcement), empty (`empty` node or `emptyMessage`), rows.
 *
 * Phones: `mobileLayout="scroll"` (default) keeps the table and scrolls
 * horizontally inside its container; `"stack"` re-flows rows into labelled
 * blocks. `variant="embedded"` drops the outer border for use inside a
 * `Card`.
 */
export function DataTable<Row>({
  caption,
  className,
  columns,
  empty,
  emptyMessage = "No records available.",
  error,
  keyField,
  loading = false,
  loadingLabel = "Loading records",
  loadingRows = 5,
  mobileLayout = "scroll",
  rows,
  variant = "standalone",
}: Readonly<{
  /** Accessible table name (visually hidden). */
  caption?: string;
  className?: string;
  columns: readonly TableColumn<Row>[];
  /** Rich empty state (for example `EmptyState`); overrides `emptyMessage`. */
  empty?: ReactNode;
  emptyMessage?: string;
  /** Error content (for example `ErrorState`); replaces the rows. */
  error?: ReactNode;
  keyField: (row: Row) => string;
  loading?: boolean;
  loadingLabel?: string;
  loadingRows?: number;
  mobileLayout?: DataTableMobileLayout;
  rows: readonly Row[];
  variant?: "standalone" | "embedded";
}>) {
  const stack = mobileLayout === "stack";
  const showLoading = loading && !error;
  const role = (value: string) => (stack ? value : undefined);
  const columnKey = (column: TableColumn<Row>) => column.id ?? column.header;

  function stateRow(content: ReactNode) {
    return (
      <tr role={role("row")}>
        <td
          className="text-fg-muted px-4 py-10 text-center md:px-6"
          colSpan={columns.length}
          role={role("cell")}
        >
          {content}
        </td>
      </tr>
    );
  }

  let body: ReactNode;
  if (error) {
    body = stateRow(error);
  } else if (showLoading) {
    body = Array.from({ length: loadingRows }, (_, index) => (
      <tr aria-hidden="true" className={cn(stack && stackedRow)} key={index}>
        {columns.map((column) => (
          <td
            className={cn(
              "border-border border-b px-6 py-3.5",
              stack && "max-md:block max-md:border-0 max-md:px-0 max-md:py-1",
            )}
            key={columnKey(column)}
          >
            <Skeleton
              className={cn(
                "h-4 w-full max-w-36",
                column.align === "right" && "ml-auto",
              )}
            />
          </td>
        ))}
      </tr>
    ));
  } else if (rows.length === 0) {
    body = stateRow(empty ?? emptyMessage);
  } else {
    body = rows.map((row) => (
      <tr
        className={cn("group/row", stack && stackedRow)}
        key={keyField(row)}
        role={role("row")}
      >
        {columns.map((column) => (
          <td
            className={cn(
              "border-border text-fg-muted border-b px-6 py-3.5 align-middle group-last/row:border-b-0",
              alignClasses[column.align ?? "left"],
              stack && stackedCell,
              column.className,
            )}
            data-label={column.mobileLabel ?? column.header}
            key={columnKey(column)}
            role={role("cell")}
          >
            {column.cell(row)}
          </td>
        ))}
      </tr>
    ));
  }

  return (
    <div
      className={cn(
        "bg-surface",
        variant === "standalone" &&
          "border-border overflow-hidden rounded-xl border",
        className,
      )}
    >
      {showLoading ? <LoadingStatus label={loadingLabel} /> : null}
      {/* `relative`: the scroll region also contains absolutely positioned
          descendants (sr-only text), so they cannot widen the page. */}
      <div
        className={cn(
          "relative overflow-x-auto",
          stack && "max-md:overflow-visible",
        )}
      >
        <table
          aria-busy={showLoading || undefined}
          className={cn(
            "text-label w-full min-w-full border-collapse font-normal",
            stack && "max-md:block",
          )}
          role={role("table")}
        >
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead
            className={cn(stack && "max-md:sr-only")}
            role={role("rowgroup")}
          >
            <tr role={role("row")}>
              {columns.map((column) => (
                <th
                  className={cn(
                    alignClasses[column.align ?? "left"],
                    "border-border bg-surface-2 text-caption text-fg-subtle border-b px-6 py-3 font-semibold tracking-[0.04em] whitespace-nowrap uppercase",
                    column.className,
                  )}
                  key={columnKey(column)}
                  role={role("columnheader")}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={cn(stack && "max-md:block")}
            role={role("rowgroup")}
          >
            {body}
          </tbody>
        </table>
      </div>
    </div>
  );
}
