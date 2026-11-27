"use client";

import { cn } from "@template/ui-core";
import type { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "./sidebar-context";

export const DASHBOARD_MAIN_ID = "main-content";

type DashboardShellProps = Readonly<{
  children: ReactNode;
  /** Initial sidebar state; previews and tests only. */
  defaultExpanded?: boolean;
  /** Initial drawer state; previews and tests only. */
  defaultMobileOpen?: boolean;
  /** `MobileNavDrawer`, used below `lg`. */
  mobileNav?: ReactNode;
  /** `DashboardSidebar`, the persistent navigation from `lg`. */
  sidebar: ReactNode;
  /** `MobileTabBar`, phones only (user portal). */
  tabBar?: ReactNode;
  /** `DashboardTopbar`. */
  topbar: ReactNode;
}>;

/**
 * Authenticated dashboard layout (reference `.shell`): a fixed sidebar from
 * `lg`, and a content column with a sticky top bar, the page (max 1280px,
 * 32px padding; 20px × 16px on phones) and an optional phone tab bar. The
 * document scrolls; the sidebar scrolls its own navigation. The column's
 * offset follows the sidebar width tokens (`w-sidebar`,
 * `w-sidebar-collapsed`), so the two stay in step.
 *
 * Print: the sidebar, drawer, top bar and tab bar are hidden and the page
 * column loses its offset and padding, so only page content prints (for
 * example a billing document; pages hide their own controls).
 *
 * Stacking (theme layers): top bar and sidebar `z-sticky`, tab bar
 * `z-tabbar`, drawer scrim `z-overlay`, drawer `z-drawer`, menus
 * `z-popover`, tooltips `z-tooltip`.
 */
export function DashboardShell({
  defaultExpanded,
  defaultMobileOpen,
  ...props
}: DashboardShellProps) {
  return (
    <SidebarProvider
      defaultExpanded={defaultExpanded}
      defaultMobileOpen={defaultMobileOpen}
    >
      <DashboardFrame {...props} />
    </SidebarProvider>
  );
}

function DashboardFrame({
  children,
  mobileNav,
  sidebar,
  tabBar,
  topbar,
}: Omit<DashboardShellProps, "defaultExpanded" | "defaultMobileOpen">) {
  const { isExpanded } = useSidebar();

  return (
    <div
      className="bg-bg text-fg min-h-dvh print:min-h-0! print:bg-transparent!"
      data-dashboard-shell=""
    >
      <a
        className="bg-surface text-label text-fg z-tooltip sr-only rounded-md px-4 py-3 shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href={`#${DASHBOARD_MAIN_ID}`}
      >
        Skip to content
      </a>
      <div className="contents print:hidden" data-print-hidden="">
        {sidebar}
        {mobileNav}
      </div>
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 ease-in-out motion-reduce:transition-none print:min-h-0! print:pl-0!",
          isExpanded ? "lg:pl-sidebar" : "lg:pl-sidebar-collapsed",
        )}
      >
        <div className="contents print:hidden" data-print-hidden="">
          {topbar}
        </div>
        <main
          className="max-w-content md:p-page w-full min-w-0 flex-1 px-4 pt-5 pb-7 focus:outline-none print:max-w-none! print:p-0!"
          id={DASHBOARD_MAIN_ID}
          tabIndex={-1}
        >
          {children}
        </main>
        <div className="contents print:hidden" data-print-hidden="">
          {tabBar}
        </div>
      </div>
    </div>
  );
}
