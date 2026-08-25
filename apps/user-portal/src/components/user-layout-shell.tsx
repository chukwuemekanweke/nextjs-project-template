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
import { branding } from "@/config/env";
import { LogoutButton } from "./logout-button";

export function UserLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  if (["/sign-in", "/register", "/confirm-email"].includes(pathname)) {
    return children;
  }

  return (
    <DashboardShell
      mobileNav={
        <MobileNav
          activeHref={pathname}
          ariaLabel="User navigation"
          brand={branding.portals.user}
          items={userNavigation}
        />
      }
      sidebar={
        <DashboardSidebar
          brand={
            <div>
              <Link
                className="text-xl font-semibold text-gray-800 dark:text-white/90"
                href="/dashboard"
              >
                {branding.productName}
              </Link>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {branding.portals.user}
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
              { href: "/dashboard", label: branding.portals.user },
              { label: currentLabel(pathname) },
            ]}
          />
          <ProfileMenu
            actions={[
              <Link href="/profile" key="profile">
                View profile
              </Link>,
              <Link href="/" key="sessions">
                Manage sessions
              </Link>,
              <LogoutButton key="logout" />,
            ]}
            meta="Verified account"
            name="Signed-in user"
            role={branding.portals.user}
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
