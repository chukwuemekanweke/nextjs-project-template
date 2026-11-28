"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentProfile } from "@template/api-react/profiles";
import {
  AccountSummary,
  Breadcrumbs,
  DashboardBrand,
  DashboardShell,
  DashboardSidebar,
  DashboardSidebarNav,
  DashboardTopbar,
  MobileNavDrawer,
  MobileTabBar,
  ProfileMenu,
  type DashboardNavItem,
} from "@template/dashboard-ui";
import {
  buttonVariants,
  cn,
  CreditCardIcon,
  DarkModeSwitch,
  HomeIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "@template/ui-core";
import type { ReactNode } from "react";
import {
  userBreadcrumbs,
  userNavigation,
  userTabNavigation,
} from "@/config/navigation";
import { branding } from "@/config/env";
import { hasProfileIdentity, profileName } from "@/lib/profile-display";
import { usesDashboardShell } from "@/lib/user-layout";
import { LogoutButton } from "./logout-button";
import { PasskeyAddedModal } from "./passkey-added-modal";

const navigationIcons: Readonly<Record<string, ReactNode>> = {
  "/billing": <CreditCardIcon />,
  "/dashboard": <HomeIcon />,
  "/preferences": <SettingsIcon />,
  "/profile": <UserIcon />,
  "/security": <ShieldIcon />,
};

const withIcons = (
  items: readonly { label: string; href: string }[],
): DashboardNavItem[] =>
  items.map((item) => ({ ...item, icon: navigationIcons[item.href] }));

const navigationItems = withIcons(userNavigation);
const tabItems = withIcons(userTabNavigation);

const NAVIGATION_LABEL = "User navigation";
const sidebarActionClassName = cn(
  buttonVariants({ fullWidth: true, variant: "ghost" }),
  "justify-start",
);

/** Shown until the profile loads, or if it cannot be loaded. */
const FALLBACK_ACCOUNT_NAME = "Your account";

export function UserLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  if (!usesDashboardShell(pathname)) {
    return children;
  }

  return (
    <UserDashboardShell pathname={pathname}>{children}</UserDashboardShell>
  );
}

function UserDashboardShell({
  children,
  pathname,
}: Readonly<{ children: ReactNode; pathname: string }>) {
  const account = useAccountIdentity();
  const brand = (
    <DashboardBrand href="/dashboard" name={branding.productName} />
  );
  const navigation = (
    <DashboardSidebarNav
      activeHref={pathname}
      ariaLabel={NAVIGATION_LABEL}
      items={navigationItems}
    />
  );

  return (
    <DashboardShell
      mobileNav={
        <MobileNavDrawer
          brand={brand}
          footer={
            <>
              <DarkModeSwitch />
              <LogoutButton className={sidebarActionClassName} />
            </>
          }
          header={
            <AccountSummary
              avatarSrc={account.avatarSrc}
              className="border-border bg-surface-2 rounded-lg border p-3"
              detail={account.email}
              name={account.name}
            />
          }
        >
          {navigation}
        </MobileNavDrawer>
      }
      sidebar={
        <DashboardSidebar
          brand={brand}
          brandMark={
            <DashboardBrand
              compact
              href="/dashboard"
              name={branding.productName}
            />
          }
          footer={
            <>
              <div className="border-border bg-surface-2 text-small flex flex-col gap-2 rounded-lg border p-4">
                <span className="text-fg font-semibold">Need help?</span>
                <span className="text-fg-muted break-words">
                  Email{" "}
                  <a
                    className="text-brand-ink underline underline-offset-2"
                    href={`mailto:${branding.supportEmail}`}
                  >
                    {branding.supportEmail}
                  </a>{" "}
                  and our team will help.
                </span>
              </div>
              <LogoutButton className={sidebarActionClassName} />
            </>
          }
        >
          {navigation}
        </DashboardSidebar>
      }
      tabBar={
        <MobileTabBar
          activeHref={pathname}
          ariaLabel="Primary"
          items={tabItems}
        />
      }
      topbar={
        <DashboardTopbar
          actions={
            <ProfileMenu
              actions={[
                <Link href="/profile" key="profile">
                  <UserIcon />
                  View profile
                </Link>,
                <Link href="/security" key="security">
                  <ShieldIcon />
                  Security and sessions
                </Link>,
                <LogoutButton key="logout" />,
              ]}
              avatarSrc={account.avatarSrc}
              name={account.name}
              role={account.email ?? branding.portals.user}
            />
          }
          brand={
            <DashboardBrand
              href="/dashboard"
              name={branding.productName}
              size="sm"
            />
          }
          breadcrumbs={<Breadcrumbs items={userBreadcrumbs(pathname)} />}
        />
      }
    >
      {children}
      <PasskeyAddedModal />
    </DashboardShell>
  );
}

/**
 * The signed-in user's name, email and avatar from the current-profile
 * query (shared with the profile page, so edits refresh it). Never a
 * placeholder identity: while loading or on failure only a neutral label.
 */
function useAccountIdentity(): {
  avatarSrc?: string | null;
  email?: string;
  name: string;
} {
  const { data: profile } = useCurrentProfile();
  if (!profile || !hasProfileIdentity(profile)) {
    return { name: FALLBACK_ACCOUNT_NAME };
  }
  const email = profile.emailAddress.trim();
  return {
    avatarSrc: profile.avatarUrl,
    email: email || undefined,
    name: profileName(profile),
  };
}
