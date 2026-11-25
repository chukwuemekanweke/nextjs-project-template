import type {
  DashboardNavGroup,
  DashboardNavItem,
} from "@template/dashboard-ui";
import {
  ActivityIcon,
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  GridIcon,
  HistoryIcon,
  HomeIcon,
  LockIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "@template/ui-core";

/*
 * Workbench-only navigation: the complete reference sidebars of design
 * revision a7e2a63 (3-user-portal/UserDashboard.html,
 * 4-admin-portal/AdminDashboard.html), including destinations that have no
 * route or backend yet (wallet, verification, admin operations, invoices).
 * Production navigation lists only implemented routes and lives in each
 * app's src/config/navigation.ts; nothing here is imported by applications.
 * Icons are the nearest curated Lucide glyphs.
 */

export const userReferenceNavigation: readonly DashboardNavItem[] = [
  { href: "/dashboard", icon: <HomeIcon />, label: "Overview" },
  { href: "/profile", icon: <UserIcon />, label: "Profile" },
  { href: "/verification", icon: <ShieldCheckIcon />, label: "Verification" },
  { href: "/wallet", icon: <WalletIcon />, label: "Wallet" },
  { href: "/billing", icon: <CreditCardIcon />, label: "Billing" },
  { href: "/security", icon: <ShieldIcon />, label: "Security" },
  { href: "/preferences", icon: <SettingsIcon />, label: "Preferences" },
];

export const userReferenceTabs: readonly DashboardNavItem[] = [
  { href: "/dashboard", icon: <HomeIcon />, label: "Home" },
  { href: "/wallet", icon: <WalletIcon />, label: "Wallet" },
  { href: "/billing", icon: <CreditCardIcon />, label: "Billing" },
  { href: "/security", icon: <ShieldIcon />, label: "Security" },
  { href: "/profile", icon: <UserIcon />, label: "Account" },
];

export const adminReferenceNavigation: readonly DashboardNavGroup[] = [
  { items: [{ href: "/", icon: <GridIcon />, label: "Dashboard" }] },
  {
    label: "Analytics",
    items: [
      {
        href: "/analytics/registrations",
        icon: <TrendingUpIcon />,
        label: "Registrations",
      },
      {
        href: "/analytics/active-users",
        icon: <ActivityIcon />,
        label: "Active users",
      },
      {
        href: "/analytics/payments",
        icon: <CreditCardIcon />,
        label: "Payment analytics",
      },
      {
        href: "/analytics/subscriptions",
        icon: <TrendingUpIcon />,
        label: "Subscription analytics",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/users", icon: <UsersIcon />, label: "Users" },
      { href: "/roles", icon: <LockIcon />, label: "Roles & permissions" },
      { href: "/kyc", icon: <ShieldCheckIcon />, label: "KYC monitoring" },
      { href: "/payments", icon: <CreditCardIcon />, label: "Payments" },
      { href: "/invoices", icon: <FileTextIcon />, label: "Invoices" },
      { href: "/subscriptions", icon: <HistoryIcon />, label: "Subscriptions" },
      { href: "/plans", icon: <GridIcon />, label: "Plans" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/providers", icon: <GlobeIcon />, label: "Providers" },
      {
        href: "/reference-data",
        icon: <DatabaseIcon />,
        label: "Reference data",
      },
      { href: "/audit", icon: <HistoryIcon />, label: "Audit history" },
      {
        href: "/system-health",
        icon: <ActivityIcon />,
        label: "System health",
      },
    ],
  },
];

/** Reference sample identities; previews only. */
export const userAccountFixture = {
  email: "ada@example.com",
  name: "Ada Okafor",
} as const;

export const adminAccountFixture = {
  detail: "Administrator",
  name: "Chidi Nwosu",
} as const;

/** Stress values for truncation and wrapping. */
export const longAccountFixture = {
  email:
    "adaeze.oluwaseun-nwachukwu@an-unusually-long-organisation-domain.example",
  name: "Adaeze Oluwaseun-Nwachukwu Okonkwo-Bakare",
} as const;

export const longNavigationLabelsFixture: DashboardNavGroup = {
  label: "An unusually long navigation section label",
  items: [
    {
      href: "/long-1",
      icon: <DatabaseIcon />,
      label: "Organisation-wide reference data maintenance",
    },
    {
      href: "/long-2",
      icon: <HistoryIcon />,
      label: "Administrative audit history export",
    },
  ],
};
