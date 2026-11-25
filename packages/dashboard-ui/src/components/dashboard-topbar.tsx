"use client";

import { IconButton, MenuIcon, PanelLeftIcon } from "@template/ui-core";
import type { ReactNode } from "react";
import { MOBILE_NAV_DRAWER_ID } from "./mobile-nav";
import { DASHBOARD_SIDEBAR_ID } from "./sidebar";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "./theme-toggle";

/**
 * Application top bar (reference `.top` from `lg`, `.m-top` below), sticky
 * above the page content. Not the page heading: pages render
 * `DashboardHeader` inside the content area.
 *
 * - Below `lg`: menu button (opens `MobileNavDrawer`) and the brand.
 * - From `lg`: sidebar collapse button.
 * - From `md`: breadcrumbs and the theme switch (on phones the theme switch
 *   lives in the drawer, as in the reference).
 * - `actions`: application controls, for example the `ProfileMenu`.
 */
export function DashboardTopbar({
  actions,
  brand,
  breadcrumbs,
}: Readonly<{
  actions?: ReactNode;
  /** Brand shown below `lg`, where the sidebar is hidden. */
  brand: ReactNode;
  breadcrumbs?: ReactNode;
}>) {
  const { isExpanded, isMobileOpen, openMobileSidebar, toggleSidebar } =
    useSidebar();

  return (
    // Minimum heights plus the reference padding around 44px controls
    // (10px phone, 14px desktop), as `.m-top` and `.top` render.
    <header className="border-border bg-surface z-sticky min-h-topbar-mobile md:px-topbar-x lg:min-h-topbar sticky top-0 flex shrink-0 items-center gap-3 border-b px-4 py-2.5 lg:py-3.5">
      <IconButton
        aria-controls={MOBILE_NAV_DRAWER_ID}
        aria-expanded={isMobileOpen}
        aria-haspopup="dialog"
        className="lg:hidden"
        icon={<MenuIcon />}
        label="Open menu"
        onClick={openMobileSidebar}
      />
      <IconButton
        aria-controls={DASHBOARD_SIDEBAR_ID}
        aria-expanded={isExpanded}
        className="-ml-2 max-lg:hidden"
        icon={<PanelLeftIcon />}
        label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        onClick={toggleSidebar}
        variant="ghost"
      />
      <div className="flex min-w-0 shrink-0 items-center lg:hidden">
        {brand}
      </div>
      {/* Between md and lg the brand precedes the trail; divide them. */}
      <div className="border-border flex min-w-0 flex-1 items-center max-lg:border-l max-lg:pl-3 max-md:hidden">
        {breadcrumbs}
      </div>
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
        {/* Bordered, as the reference `.icon-btn` theme button. */}
        <ThemeToggle className="border-border bg-surface border max-md:hidden" />
        {actions}
      </div>
    </header>
  );
}
