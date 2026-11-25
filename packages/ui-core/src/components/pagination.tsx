import Link from "next/link";
import { cn } from "../lib/cn";
import { Button, buttonVariants } from "./button";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/** "Showing 11–20 of 42" when totals are known, otherwise "Page 2 of 5". */
export function describePageRange({
  page,
  pageSize,
  totalItems,
  totalPages,
}: Readonly<{
  page: number;
  pageSize?: number;
  totalItems?: number;
  totalPages: number;
}>): string {
  if (totalItems !== undefined && pageSize !== undefined) {
    if (totalItems === 0) return "No results";
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, totalItems);
    return `Showing ${first}–${last} of ${totalItems}`;
  }
  return `Page ${page} of ${Math.max(totalPages, 1)}`;
}

/**
 * Previous / next pager (reference `.pager`) shown under a table. The app
 * owns the page state: pass `getHref` for URL-driven pages (links) or
 * `onPageChange` for client state (buttons). Boundary controls are disabled
 * buttons, never dead links; `loading` disables both while a page loads.
 * The range text is a polite live region.
 */
export function Pager({
  className,
  getHref,
  label = "Pagination",
  loading = false,
  nextLabel = "Next",
  onPageChange,
  page,
  pageSize,
  previousLabel = "Previous",
  totalItems,
  totalPages,
}: Readonly<{
  className?: string;
  getHref?: (page: number) => string;
  label?: string;
  loading?: boolean;
  nextLabel?: string;
  onPageChange?: (page: number) => void;
  page: number;
  pageSize?: number;
  previousLabel?: string;
  totalItems?: number;
  totalPages: number;
}>) {
  const controls = [
    {
      disabled: loading || page <= 1,
      icon: <ChevronLeftIcon />,
      label: previousLabel,
      target: page - 1,
      position: "leading" as const,
    },
    {
      disabled: loading || page >= totalPages,
      icon: <ChevronRightIcon />,
      label: nextLabel,
      target: page + 1,
      position: "trailing" as const,
    },
  ];

  return (
    <nav
      aria-busy={loading || undefined}
      aria-label={label}
      className={cn(
        "border-border text-label text-fg-muted flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 font-normal md:px-6 md:py-3.5",
        className,
      )}
    >
      <span aria-live="polite">
        {describePageRange({ page, pageSize, totalItems, totalPages })}
      </span>
      <div className="flex items-center gap-2">
        {controls.map((control) => {
          const iconProps =
            control.position === "leading"
              ? { leadingIcon: control.icon }
              : { trailingIcon: control.icon };
          if (getHref && !control.disabled) {
            return (
              <Button
                asChild
                key={control.label}
                size="sm"
                variant="secondary"
                {...iconProps}
              >
                <Link href={getHref(control.target)}>{control.label}</Link>
              </Button>
            );
          }
          return (
            <Button
              disabled={control.disabled}
              key={control.label}
              onClick={
                onPageChange ? () => onPageChange(control.target) : undefined
              }
              size="sm"
              variant="secondary"
              {...iconProps}
            >
              {control.label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * @deprecated Use `Pager`. Numbered link pagination kept for existing
 * consumers; boundary links render as disabled text instead of dead links.
 */
export function Pagination({
  currentPage,
  totalPages,
  getHref,
}: Readonly<{
  currentPage: number;
  totalPages: number;
  getHref: (page: number) => string;
}>) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const pageClassName =
    "text-label inline-flex min-h-control-sm min-w-9 items-center justify-center rounded-sm px-3 font-medium";

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
      <BoundaryLink
        disabled={currentPage <= 1}
        href={getHref(Math.max(1, currentPage - 1))}
        label="Previous"
      />
      {pages.map((page) =>
        page === currentPage ? (
          <span
            aria-current="page"
            className={cn(pageClassName, "bg-brand text-on-brand")}
            key={page}
          >
            {page}
          </span>
        ) : (
          <Link
            className={cn(
              pageClassName,
              "text-fg-muted hover:bg-hover hover:text-fg focus-visible:outline-focus focus-visible:outline-2",
            )}
            href={getHref(page)}
            key={page}
          >
            {page}
          </Link>
        ),
      )}
      <BoundaryLink
        disabled={currentPage >= totalPages}
        href={getHref(Math.min(totalPages, currentPage + 1))}
        label="Next"
      />
    </nav>
  );
}

function BoundaryLink({
  disabled,
  href,
  label,
}: Readonly<{ disabled: boolean; href: string; label: string }>) {
  const className = buttonVariants({ size: "sm", variant: "secondary" });
  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {label}
      </span>
    );
  }
  return (
    <Link className={className} href={href}>
      {label}
    </Link>
  );
}
