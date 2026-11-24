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
  const { isExpanded, isMobileOpen, closeMobileSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {sidebar}
      {isMobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={closeMobileSidebar}
          type="button"
        />
      ) : null}
      <div
        className={[
          "flex min-h-screen min-w-0 flex-col transition-[margin] duration-200 ease-in-out motion-reduce:transition-none",
          isExpanded ? "lg:ml-[224px]" : "lg:ml-[72px]",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900">
          {mobileNav}
          <div className="min-w-0 flex-1">{topbar}</div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
