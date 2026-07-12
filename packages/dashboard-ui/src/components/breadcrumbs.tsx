import Link from "next/link";
import type { BreadcrumbItem } from "../types";

export function Breadcrumbs({
  items,
}: Readonly<{ items: readonly BreadcrumbItem[] }>) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => (
          <li
            className="flex items-center gap-1.5"
            key={`${item.label}-${index}`}
          >
            {index > 0 ? <span className="text-gray-400">›</span> : null}
            {item.href ? (
              <Link
                className="hover:text-brand-500 text-gray-500 dark:text-gray-400"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-800 dark:text-white/90">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
