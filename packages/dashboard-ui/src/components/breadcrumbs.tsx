import { ChevronRightIcon } from "@template/ui-core";
import Link from "next/link";
import type { BreadcrumbItem } from "../types";

/**
 * Top-bar breadcrumb trail (reference `.crumbs`): ancestors in the muted
 * colour, the current page in the foreground colour. Long labels truncate;
 * the current page keeps priority and the full label stays in `title`.
 */
export function Breadcrumbs({
  items,
}: Readonly<{ items: readonly BreadcrumbItem[] }>) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="text-label text-fg-subtle flex min-w-0 items-center gap-2 font-normal">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              className={
                last
                  ? "flex min-w-0 items-center gap-2"
                  : "flex max-w-[40%] min-w-0 shrink-[2] items-center gap-2"
              }
              key={`${item.label}-${index}`}
            >
              {index > 0 ? (
                <ChevronRightIcon className="size-icon-xs shrink-0" />
              ) : null}
              {item.href && !last ? (
                <Link
                  className="hover:text-fg truncate rounded-sm transition-colors"
                  href={item.href}
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "text-fg truncate font-medium" : "truncate"}
                  title={item.label}
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
