import Link from "next/link";

/**
 * TailAdmin-inspired pagination primitives adapted for this workspace.
 * Copyright (c) TailAdmin. Retained under the MIT License.
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

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <PaginationLink
        ariaDisabled={currentPage === 1}
        href={getHref(Math.max(1, currentPage - 1))}
        label="Previous"
      />
      {pages.map((page) => (
        <Link
          aria-current={page === currentPage ? "page" : undefined}
          className={[
            "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 font-medium",
            page === currentPage
              ? "bg-brand-500 text-white"
              : "hover:bg-brand-500/10 hover:text-brand-500 text-gray-700 dark:text-gray-400",
          ].join(" ")}
          href={getHref(page)}
          key={page}
        >
          {page}
        </Link>
      ))}
      <PaginationLink
        ariaDisabled={currentPage === totalPages}
        href={getHref(Math.min(totalPages, currentPage + 1))}
        label="Next"
      />
    </nav>
  );
}

function PaginationLink({
  href,
  label,
  ariaDisabled,
}: Readonly<{
  href: string;
  label: string;
  ariaDisabled: boolean;
}>) {
  return (
    <Link
      aria-disabled={ariaDisabled}
      className={[
        "shadow-theme-xs inline-flex h-10 items-center justify-center rounded-lg border px-3.5",
        ariaDisabled
          ? "pointer-events-none border-gray-300 bg-white text-gray-400 opacity-50 dark:border-gray-700 dark:bg-gray-800"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]",
      ].join(" ")}
      href={href}
      tabIndex={ariaDisabled ? -1 : undefined}
    >
      {label}
    </Link>
  );
}
