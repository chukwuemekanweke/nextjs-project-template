"use client";

import type { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "./sidebar-context";

export function DashboardShell(
  props: Readonly<{
    mobileNav?: ReactNode;
    sidebar: ReactNode;
    topbar: ReactNode;
    children: ReactNode;
  }>,
) {
  return (
    <SidebarProvider>
      <DashboardFrame {...props} />
    </SidebarProvider>
  );
}

function DashboardFrame({
  mobileNav,
  sidebar,
  topbar,
  children,
}: Readonly<{
  mobileNav?: ReactNode;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}>) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } =
    useSidebar();
  const wide = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {sidebar}
      {isMobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={toggleMobileSidebar}
          type="button"
        />
      ) : null}
      <div
        className={[
          "min-h-screen transition-all duration-300 ease-in-out",
          wide ? "lg:ml-[290px]" : "lg:ml-[90px]",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="lg:flex lg:items-center">
            <div className="lg:flex-none">{mobileNav}</div>
            <div className="border-t border-gray-200 px-4 py-3 sm:px-6 lg:flex-1 lg:border-t-0 lg:px-2 dark:border-gray-800">
              {topbar}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1536px] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
