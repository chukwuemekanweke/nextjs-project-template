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
import { userNavigation } from "@/config/navigation";

export function UserLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return (
    <DashboardShell
      mobileNav={
        <MobileNav
          activeHref={pathname}
          ariaLabel="User navigation"
          brand="User Portal"
          items={userNavigation}
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
                Product Workspace
              </Link>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Self-service account management and activity.
              </p>
            </div>
          }
          footer={
            <p>Identity and policy decisions are sourced from the backend.</p>
          }
          sectionLabel="Account"
        >
          <DashboardSidebarNav
            activeHref={pathname}
            ariaLabel="User navigation"
            items={userNavigation}
          />
        </DashboardSidebar>
      }
      topbar={
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { href: "/", label: "Workspace" },
              { label: currentLabel(pathname) },
            ]}
          />
          <ProfileMenu
            actions={[
              <Link href="/" key="profile">
                Edit profile
              </Link>,
              <Link href="/" key="sessions">
                Manage sessions
              </Link>,
            ]}
            meta="Verified account"
            name="Signed-in user"
            role="User Portal"
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
    userNavigation.find((item) => item.href === pathname)?.label ?? "Overview"
  );
}
