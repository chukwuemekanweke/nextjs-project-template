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
  CreditCardIcon,
  HomeIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "@template/ui-core";
import type { ReactNode } from "react";
import { userNavigation } from "@/config/navigation";
import { branding } from "@/config/env";
import { usesDashboardShell } from "@/lib/user-layout";
import { LogoutButton } from "./logout-button";
import { PasskeyAddedModal } from "./passkey-added-modal";

const navigationIcons: Readonly<Record<string, ReactNode>> = {
  "/billing": <CreditCardIcon />,
  "/dashboard": <HomeIcon />,
  "/profile": <UserIcon />,
  "/security": <ShieldIcon />,
  "/settings": <SettingsIcon />,
};

const navigationItems: readonly DashboardNavItem[] = userNavigation.map(
  (item) => ({ ...item, icon: navigationIcons[item.href] }),
);

export function UserLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  if (!usesDashboardShell(pathname)) {
    return children;
  }

  return (
    <DashboardShell
      mobileNav={
        <MobileNav ariaLabel="User navigation" brand={branding.productName} />
      }
      sidebar={
        <DashboardSidebar
          brand={
            <DashboardBrand
              href="/dashboard"
              name={branding.productName}
              subtitle={branding.portals.user}
            />
          }
          brandMark={
            <DashboardBrand
              compact
              href="/dashboard"
              name={branding.productName}
            />
          }
        >
          <DashboardSidebarNav
            activeHref={pathname}
            ariaLabel="User navigation"
            items={navigationItems}
          />
        </DashboardSidebar>
      }
      topbar={
        <div className="flex items-center justify-between gap-3">
          <div className="hidden min-w-0 sm:block">
            <Breadcrumbs
              items={[
                { href: "/dashboard", label: branding.portals.user },
                { label: currentLabel(pathname) },
              ]}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
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
        </div>
      }
    >
      {children}
      <PasskeyAddedModal />
    </DashboardShell>
  );
}

function currentLabel(pathname: string) {
  return (
    userNavigation.find(
      (item) => item.href === pathname || pathname.startsWith(`${item.href}/`),
    )?.label ?? "Overview"
  );
}
