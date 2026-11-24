"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumbs,
  DashboardBrand,
  DashboardShell,
  DashboardSidebar,
  DashboardSidebarNav,
  MobileNav,
  ProfileMenu,
  ThemeToggle,
  type DashboardNavItem,
} from "@template/dashboard-ui";
import {
  ActivityIcon,
  DatabaseIcon,
  GridIcon,
  HistoryIcon,
  LockIcon,
  UsersIcon,
} from "@template/ui-core";
import type { ReactNode } from "react";
import { adminNavigation } from "@/config/navigation";
import { branding } from "@/config/env";
import { LogoutButton } from "./logout-button";

const navigationIcons: Readonly<Record<string, ReactNode>> = {
  "/": <GridIcon />,
  "/audit": <HistoryIcon />,
  "/reference-data": <DatabaseIcon />,
  "/roles": <LockIcon />,
  "/system-health": <ActivityIcon />,
  "/users": <UsersIcon />,
};

const navigationItems: readonly DashboardNavItem[] = adminNavigation.map(
  (item) => ({ ...item, icon: navigationIcons[item.href] }),
);

export function AdminLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  if (pathname === "/sign-in") {
    return children;
  }

  return (
    <DashboardShell
      mobileNav={
        <MobileNav ariaLabel="Admin navigation" brand={branding.productName} />
      }
      sidebar={
        <DashboardSidebar
          brand={
            <DashboardBrand
              href="/"
              name={branding.productName}
              subtitle={branding.portals.admin}
            />
          }
          brandMark={
            <DashboardBrand compact href="/" name={branding.productName} />
          }
        >
          <DashboardSidebarNav
            activeHref={pathname}
            ariaLabel="Admin navigation"
            items={navigationItems}
          />
        </DashboardSidebar>
      }
      topbar={
        <div className="flex items-center justify-between gap-3">
          <div className="hidden min-w-0 sm:block">
            <Breadcrumbs
              items={[
                { href: "/", label: "Admin" },
                { label: currentLabel(pathname) },
              ]}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu
              actions={[
                <Link href="/" key="preferences">
                  Workspace settings
                </Link>,
                <Link href="/" key="audit">
                  Review audit events
                </Link>,
                <LogoutButton key="logout" />,
              ]}
              meta="Privileged session"
              name="Signed-in administrator"
              role={branding.portals.admin}
            />
          </div>
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
