"use client";

import { usePathname } from "next/navigation";
import {
  AccountSummary,
  Breadcrumbs,
  DashboardBrand,
  DashboardShell,
  DashboardSidebar,
  DashboardSidebarNav,
  DashboardTopbar,
  MobileNavDrawer,
  ProfileMenu,
  type DashboardNavGroup,
} from "@template/dashboard-ui";
import {
  buttonVariants,
  cn,
  DarkModeSwitch,
  GridIcon,
} from "@template/ui-core";
import type { ReactNode } from "react";
import { adminBreadcrumbs, adminNavigation } from "@/config/navigation";
import { branding } from "@/config/env";
import { LogoutButton } from "./logout-button";

const navigationIcons: Readonly<Record<string, ReactNode>> = {
  "/": <GridIcon />,
};

const navigationGroups: readonly DashboardNavGroup[] = adminNavigation.map(
  (group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      icon: navigationIcons[item.href],
    })),
  }),
);

const NAVIGATION_LABEL = "Admin navigation";
const PORTAL_BADGE = "Admin";
const sidebarActionClassName = cn(
  buttonVariants({ fullWidth: true, variant: "ghost" }),
  "justify-start",
);

/**
 * The admin BFF exposes no profile or identity read yet, so the shell shows
 * the role it admitted rather than a placeholder person (DR-027).
 */
const ADMIN_ACCOUNT_NAME = "Administrator";

export function AdminLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  if (pathname === "/sign-in") {
    return children;
  }

  const brand = (
    <DashboardBrand badge={PORTAL_BADGE} href="/" name={branding.productName} />
  );
  const navigation = (
    <DashboardSidebarNav
      activeHref={pathname}
      ariaLabel={NAVIGATION_LABEL}
      groups={navigationGroups}
    />
  );

  return (
    <DashboardShell
      mobileNav={
        <MobileNavDrawer
          brand={brand}
          footer={
            <>
              <AccountSummary
                className="px-2 py-1"
                detail={branding.portals.admin}
                name={ADMIN_ACCOUNT_NAME}
              />
              <DarkModeSwitch className="px-2" />
              <LogoutButton className={sidebarActionClassName} />
            </>
          }
          title="Admin menu"
        >
          {navigation}
        </MobileNavDrawer>
      }
      sidebar={
        <DashboardSidebar
          brand={brand}
          brandMark={
            <DashboardBrand compact href="/" name={branding.productName} />
          }
          footer={<LogoutButton className={sidebarActionClassName} />}
        >
          {navigation}
        </DashboardSidebar>
      }
      topbar={
        <DashboardTopbar
          actions={
            <ProfileMenu
              actions={[<LogoutButton key="logout" />]}
              meta="Privileged session"
              name={ADMIN_ACCOUNT_NAME}
              role={branding.portals.admin}
            />
          }
          brand={
            <DashboardBrand
              badge={PORTAL_BADGE}
              href="/"
              name={branding.productName}
              size="sm"
            />
          }
          breadcrumbs={<Breadcrumbs items={adminBreadcrumbs(pathname)} />}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
