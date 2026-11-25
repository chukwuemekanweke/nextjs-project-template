import type { ReactNode } from "react";

export type DashboardNavItem = {
  label: string;
  href: string;
  badge?: string;
  icon?: ReactNode;
};

/**
 * A run of navigation items under an optional section label (reference
 * `.nav-label`, for example "Analytics" or "Platform").
 */
export type DashboardNavGroup = {
  label?: string;
  items: readonly DashboardNavItem[];
};

export type UiNode = ReactNode;

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
