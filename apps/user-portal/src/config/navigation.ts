import {
  resolveActiveNavHref,
  type BreadcrumbItem,
} from "@template/dashboard-ui";

/**
 * User portal navigation. Only implemented routes are listed: the design's
 * Verification and Wallet items are added by the tickets that build those
 * screens (see docs/design-system/route-mapping.md). Order follows the
 * reference sidebar.
 */
export const userNavigation = [
  { label: "Overview", href: "/dashboard" },
  { label: "Profile", href: "/profile" },
  { label: "Billing", href: "/billing" },
  { label: "Security", href: "/security" },
  { label: "Preferences", href: "/preferences" },
] as const;

/**
 * Phone tab bar (reference `.m-tabs`: Home, Wallet, Billing, Security,
 * Account). Wallet is omitted until it ships; "Account" opens the profile,
 * as in the reference (DR-023).
 */
export const userTabNavigation = [
  { label: "Home", href: "/dashboard" },
  { label: "Billing", href: "/billing" },
  { label: "Security", href: "/security" },
  { label: "Account", href: "/profile" },
] as const;

/** Top-bar breadcrumb trails by route, as drawn in the reference. */
const userBreadcrumbTrails: Readonly<
  Record<string, readonly BreadcrumbItem[]>
> = {
  "/dashboard": [{ label: "Overview" }],
  "/profile": [{ label: "Account" }, { label: "Profile" }],
  "/security": [{ label: "Account" }, { label: "Security" }],
  "/preferences": [{ label: "Account" }, { label: "Preferences" }],
  "/billing": [{ label: "Billing" }],
  "/billing/checkout": [
    { label: "Billing", href: "/billing" },
    { label: "Checkout" },
  ],
  "/billing/history": [
    { label: "Billing", href: "/billing" },
    { label: "History" },
  ],
  "/billing/purchases": [
    { label: "Billing", href: "/billing" },
    { label: "History", href: "/billing/history" },
    { label: "Purchase" },
  ],
};

export function userBreadcrumbs(pathname: string): readonly BreadcrumbItem[] {
  const route = resolveActiveNavHref(
    Object.keys(userBreadcrumbTrails),
    pathname,
  );
  return route ? (userBreadcrumbTrails[route] ?? []) : [];
}
