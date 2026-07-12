import type { ReactNode } from "react";

export type DashboardNavItem = {
  label: string;
  href: string;
  badge?: string;
  icon?: ReactNode;
};

export type UiNode = ReactNode;

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
