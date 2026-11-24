"use client";

import { GridIcon } from "@template/ui-core";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardNavItem } from "../types";
import { useSidebar } from "./sidebar-context";

export const DASHBOARD_SIDEBAR_ID = "dashboard-sidebar";

/** True when `href` is the current page or an ancestor of it. */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === pathname) return true;
  return href !== "/" && pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({
  brand,
  brandMark,
  children,
  footer,
}: Readonly<{
  /** Full brand shown when the sidebar is expanded. */
  brand: ReactNode;
  /** Compact brand shown in the collapsed icon rail. */
  brandMark?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}>) {
  const { isExpanded, isMobileOpen } = useSidebar();
  const wide = isExpanded || isMobileOpen;

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-[width,transform] duration-200 ease-in-out motion-reduce:transition-none dark:border-gray-800 dark:bg-gray-900",
        wide ? "w-[224px]" : "w-[72px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
      id={DASHBOARD_SIDEBAR_ID}
    >
      <div
        className={[
          "flex h-16 shrink-0 items-center",
          wide ? "px-5" : "justify-center",
        ].join(" ")}
      >
        {wide ? brand : brandMark}
      </div>
      <div
        className={[
          "flex flex-1 flex-col px-3 pt-3 pb-6",
          // The collapsed rail stays unclipped so item tooltips can overflow.
          wide ? "no-scrollbar overflow-y-auto" : "",
        ].join(" ")}
      >
        {children}
        {footer && wide ? (
          <div className="mt-auto rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
            {footer}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function DashboardSidebarNav({
  items,
  activeHref,
  ariaLabel,
}: Readonly<{
  items: readonly DashboardNavItem[];
  activeHref: string;
  ariaLabel: string;
}>) {
  const { closeMobileSidebar, isExpanded, isMobileOpen } = useSidebar();
  const wide = isExpanded || isMobileOpen;

  return (
    <nav aria-label={ariaLabel}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isNavItemActive(item.href, activeHref);
          return (
            <li key={item.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative flex h-11 items-center gap-3 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
                  active
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300 font-semibold"
                    : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100",
                  wide ? "px-3" : "justify-center",
                ].join(" ")}
                data-active={active ? "true" : undefined}
                href={item.href}
                onClick={closeMobileSidebar}
              >
                <span
                  className={
                    active
                      ? "text-brand-500 dark:text-brand-400"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200"
                  }
                >
                  {item.icon ?? <GridIcon />}
                </span>
                {wide ? (
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                ) : (
                  // Visible on hover/focus; also the link's accessible name.
                  <span className="shadow-theme-sm pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-gray-700">
                    {item.label}
                  </span>
                )}
                {wide && item.badge ? (
                  <span className="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 rounded-full px-2 py-0.5 text-xs font-medium">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
