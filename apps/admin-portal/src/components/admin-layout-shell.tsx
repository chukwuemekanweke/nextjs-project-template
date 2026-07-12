"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumbs,
  DashboardShell,
  DashboardSidebar,
  DashboardSidebarNav,
  MobileNav,
  ProfileMenu,
} from "@template/dashboard-ui";
import type { ReactNode } from "react";
import { adminNavigation } from "@/config/navigation";

export function AdminLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return (
    <DashboardShell
      mobileNav={
        <MobileNav
          activeHref={pathname}
          ariaLabel="Admin navigation"
          brand="Admin Portal"
          items={adminNavigation}
        />
      }
      sidebar={
        <DashboardSidebar
          brand={
            <div>
              <Link
                className="text-xl font-semibold text-gray-800 dark:text-white/90"
                href="/"
              >
                Product Control
              </Link>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Operational tooling for privileged users.
              </p>
            </div>
          }
          footer={<p>Authorization remains enforced by the backend API.</p>}
          sectionLabel="Administration"
        >
          <DashboardSidebarNav
            activeHref={pathname}
            ariaLabel="Admin navigation"
            items={adminNavigation}
          />
        </DashboardSidebar>
      }
      topbar={
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { href: "/", label: "Admin" },
              { label: currentLabel(pathname) },
            ]}
          />
          <ProfileMenu
            actions={[
              <Link href="/" key="preferences">
                Workspace settings
              </Link>,
              <Link href="/" key="audit">
                Review audit events
              </Link>,
            ]}
            meta="Privileged session"
            name="Signed-in administrator"
            role="Admin Portal"
          />
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}

function currentLabel(pathname: string) {
  return (
    adminNavigation.find((item) => item.href === pathname)?.label ?? "Dashboard"
  );
}
