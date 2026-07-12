"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardNavItem } from "../types";
import { useSidebar } from "./sidebar-context";

export function DashboardSidebar({
  brand,
  sectionLabel,
  children,
  footer,
}: Readonly<{
  brand: ReactNode;
  sectionLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}>) {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const wide = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={[
        "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900",
        wide ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={[
          "flex py-8",
          wide ? "justify-start" : "justify-center",
        ].join(" ")}
      >
        <div className={wide ? "block" : "hidden"}>{brand}</div>
        {!wide ? (
          <span className="text-brand-500 text-xl font-semibold">P</span>
        ) : null}
      </div>
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
        <nav className="mb-6">
          <p
            className={[
              "mb-4 flex text-xs leading-5 text-gray-400 uppercase",
              wide ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            {wide ? sectionLabel : "•••"}
          </p>
          {children}
        </nav>
        {footer && wide ? (
          <div className="mt-auto mb-8 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
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
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const wide = isExpanded || isHovered || isMobileOpen;

  return (
    <nav aria-label={ariaLabel} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            className={[
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5",
              wide ? "justify-start" : "justify-center",
            ].join(" ")}
            href={item.href}
            key={item.href}
          >
            <span className={active ? "text-brand-500" : "text-gray-500"}>
              {item.icon ?? <NavIcon />}
            </span>
            {wide ? (
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            ) : null}
            {wide && item.badge ? (
              <span className="bg-brand-50 text-brand-500 dark:bg-brand-500/15 rounded-full px-2 py-0.5 text-xs">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
    >
      <path
        d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
