"use client";

import { cn, GridIcon } from "@template/ui-core";
import Link from "next/link";
import { resolveActiveNavHref } from "../navigation";
import type { DashboardNavItem } from "../types";

/**
 * Phone bottom tab bar (reference `.m-tabs`), below `md` only: up to five
 * primary destinations with 22px icons and 52px targets, sticky to the
 * bottom of the viewport above the safe-area inset. The full navigation
 * stays in `MobileNavDrawer`.
 */
export function MobileTabBar({
  activeHref,
  ariaLabel,
  items,
}: Readonly<{
  activeHref: string;
  ariaLabel: string;
  items: readonly DashboardNavItem[];
}>) {
  const activeItemHref = resolveActiveNavHref(
    items.map((item) => item.href),
    activeHref,
  );

  return (
    <nav
      aria-label={ariaLabel}
      className="border-border bg-surface z-tabbar sticky bottom-0 border-t px-1 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="grid auto-cols-fr grid-flow-col">
        {items.map((item) => {
          const active = item.href === activeItemHref;
          return (
            <li className="min-w-0" key={item.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "min-h-tabbar-item flex flex-col items-center justify-center gap-1 rounded-sm px-1 py-1.5 text-[0.71875rem] leading-tight font-medium transition-colors focus-visible:-outline-offset-2",
                  "[&_svg]:size-icon-lg [&_svg]:shrink-0",
                  active
                    ? "text-tab-active-fg"
                    : "text-fg-subtle hover:text-fg",
                )}
                href={item.href}
              >
                {item.icon ?? <GridIcon />}
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
