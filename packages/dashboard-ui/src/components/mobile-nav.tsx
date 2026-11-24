"use client";

import { CloseIcon, MenuIcon, PanelLeftIcon } from "@template/ui-core";
import type { ReactNode } from "react";
import { DASHBOARD_SIDEBAR_ID } from "./sidebar";
import { useSidebar } from "./sidebar-context";

const controlClassName =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200";

/**
 * Leading header controls: the off-canvas navigation toggle below `lg`, the
 * sidebar collapse toggle from `lg`, and the brand on narrow screens.
 */
export function MobileNav({
  brand,
  ariaLabel,
}: Readonly<{
  brand: ReactNode;
  /** Accessible name of the navigation the menu button opens. */
  ariaLabel: string;
}>) {
  const { isExpanded, isMobileOpen, toggleMobileSidebar, toggleSidebar } =
    useSidebar();

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <button
        aria-controls={DASHBOARD_SIDEBAR_ID}
        aria-expanded={isMobileOpen}
        aria-label={`${isMobileOpen ? "Close" : "Open"} ${ariaLabel.toLowerCase()}`}
        className={`${controlClassName} -ml-2 lg:hidden`}
        onClick={toggleMobileSidebar}
        type="button"
      >
        {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      <button
        aria-controls={DASHBOARD_SIDEBAR_ID}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        className={`${controlClassName} -ml-2 hidden lg:flex`}
        onClick={toggleSidebar}
        type="button"
      >
        <PanelLeftIcon />
      </button>
      <span className="truncate text-sm font-semibold text-gray-900 sm:hidden dark:text-white/90">
        {brand}
      </span>
    </div>
  );
}
