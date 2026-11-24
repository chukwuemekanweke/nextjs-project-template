import { ChevronRightIcon } from "@template/ui-core";
import Link from "next/link";
import type { BreadcrumbItem } from "../types";

export function Breadcrumbs({
  items,
}: Readonly<{ items: readonly BreadcrumbItem[] }>) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              className="flex min-w-0 items-center gap-1.5"
              key={`${item.label}-${index}`}
            >
              {index > 0 ? (
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              ) : null}
              {item.href && !last ? (
                <Link
                  className="hover:text-brand-600 dark:hover:text-brand-400 truncate rounded text-gray-700 transition-colors dark:text-gray-300"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="truncate text-gray-900 dark:text-white/90"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
