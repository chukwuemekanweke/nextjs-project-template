import {
  resolveActiveNavHref,
  type BreadcrumbItem,
} from "@template/dashboard-ui";

/**
 * Admin portal navigation, grouped as in the reference sidebar (Analytics,
 * Operations, Platform). Only implemented routes are listed: each
 * operational screen adds its item, under its reference group, in the
 * ticket that builds the route and its backend integration (DR-070, DR-071).
 * The full reference navigation is previewed in the UI workbench only.
 */
export const adminNavigation: readonly {
  label?: string;
  items: readonly { label: string; href: string }[];
}[] = [{ items: [{ label: "Dashboard", href: "/" }] }];

/** Top-bar breadcrumb trails by route: reference group, then page. */
const adminBreadcrumbTrails: Readonly<
  Record<string, readonly BreadcrumbItem[]>
> = {
  "/": [{ label: "Dashboard" }],
};

export function adminBreadcrumbs(pathname: string): readonly BreadcrumbItem[] {
  const route = resolveActiveNavHref(
    Object.keys(adminBreadcrumbTrails),
    pathname,
  );
  return route ? (adminBreadcrumbTrails[route] ?? []) : [];
}
