"use client";

import { cn, GridIcon, Tooltip } from "@template/ui-core";
import Link from "next/link";
import { createContext, useContext, useId, type ReactNode } from "react";
import { resolveActiveNavHref } from "../navigation";
import type { DashboardNavGroup, DashboardNavItem } from "../types";
import { useSidebar } from "./sidebar-context";

export const DASHBOARD_SIDEBAR_ID = "dashboard-sidebar";

/**
 * True inside the collapsed desktop rail. The drawer and the expanded
 * sidebar render navigation with labels.
 */
const NavRailContext = createContext(false);

/**
 * Persistent desktop navigation (reference `.side`) from the `lg`
 * breakpoint: 260px with labels, or a 72px icon rail when collapsed. Below
 * `lg` it is not rendered visually; `MobileNavDrawer` takes over.
 */
export function DashboardSidebar({
  brand,
  brandMark,
  children,
  footer,
}: Readonly<{
  /** Full brand shown when the sidebar is expanded. */
  brand: ReactNode;
  /** Compact brand shown in the collapsed icon rail. */
  brandMark?: ReactNode;
  children: ReactNode;
  /** Bottom content (help, sign out); hidden in the collapsed rail. */
  footer?: ReactNode;
}>) {
  const { isExpanded } = useSidebar();

  return (
    <aside
      className={cn(
        "border-border bg-nav-bg z-sticky fixed inset-y-0 left-0 hidden flex-col gap-5 border-r py-5 transition-[width] duration-200 ease-in-out motion-reduce:transition-none lg:flex",
        isExpanded ? "w-sidebar px-4" : "w-sidebar-collapsed px-3.5",
      )}
      id={DASHBOARD_SIDEBAR_ID}
    >
      <div
        className={cn(
          "flex min-h-10 shrink-0 items-center",
          // The expanded brand fills the row so its portal chip sits right.
          isExpanded ? "px-2 *:flex-1" : "justify-center",
        )}
      >
        {isExpanded ? brand : (brandMark ?? brand)}
      </div>
      {/* Long navigation scrolls here; brand and footer stay in place. The
          padding keeps focus outlines and the rail's 44px links unclipped. */}
      <div className="-mx-1 min-h-0 flex-1 [scrollbar-width:thin] overflow-y-auto px-1">
        <NavRailContext value={!isExpanded}>{children}</NavRailContext>
      </div>
      {footer && isExpanded ? (
        <div className="border-border flex shrink-0 flex-col gap-2 border-t pt-4">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

/**
 * Navigation links, optionally grouped under section labels. Exactly one
 * item — the most specific match for `activeHref` — is marked current.
 * Selecting an item closes the mobile drawer.
 */
export function DashboardSidebarNav({
  activeHref,
  ariaLabel,
  groups,
  items,
}: Readonly<{
  activeHref: string;
  ariaLabel: string;
  /** Labelled sections; takes precedence over `items`. */
  groups?: readonly DashboardNavGroup[];
  /** A single, unlabelled list. */
  items?: readonly DashboardNavItem[];
}>) {
  const navGroups: readonly DashboardNavGroup[] = groups ?? [
    { items: items ?? [] },
  ];
  const activeItemHref = resolveActiveNavHref(
    navGroups.flatMap((group) => group.items.map((item) => item.href)),
    activeHref,
  );

  return (
    <nav aria-label={ariaLabel} className="flex flex-col">
      {navGroups.map((group, index) => (
        <NavGroup
          activeHref={activeItemHref}
          first={index === 0}
          group={group}
          key={group.label ?? index}
        />
      ))}
    </nav>
  );
}

function NavGroup({
  activeHref,
  first,
  group,
}: Readonly<{
  activeHref: string | undefined;
  first: boolean;
  group: DashboardNavGroup;
}>) {
  const rail = useContext(NavRailContext);
  const labelId = useId();

  return (
    <div className={first ? undefined : rail ? "mt-2" : "mt-1"}>
      {group.label ? (
        <p
          className={
            rail
              ? "sr-only"
              : "text-micro text-fg-subtle truncate px-3 pt-3 pb-1.5 uppercase"
          }
          id={labelId}
        >
          {group.label}
        </p>
      ) : null}
      {rail && !first ? (
        <div aria-hidden="true" className="border-border mx-2 mb-2 border-t" />
      ) : null}
      <ul
        aria-labelledby={group.label ? labelId : undefined}
        className="flex flex-col gap-0.5"
      >
        {group.items.map((item) => (
          <li key={item.href}>
            <NavLink active={item.href === activeHref} item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavLink({
  active,
  item,
}: Readonly<{ active: boolean; item: DashboardNavItem }>) {
  const rail = useContext(NavRailContext);
  const { closeMobileSidebar } = useSidebar();

  const link = (
    <Link
      aria-current={active ? "page" : undefined}
      // In the rail the label is not rendered; it names the link instead.
      aria-label={rail ? item.label : undefined}
      className={cn(
        "min-h-control text-body flex items-center gap-3 rounded-sm font-medium transition-colors focus-visible:-outline-offset-2",
        "[&_svg]:size-icon-md [&_svg]:shrink-0",
        active
          ? "bg-nav-active-bg text-nav-active-fg"
          : "text-fg-muted hover:bg-hover hover:text-fg",
        rail ? "size-control justify-center" : "px-3 py-2.5",
      )}
      data-active={active ? "true" : undefined}
      href={item.href}
      onClick={closeMobileSidebar}
    >
      {item.icon ?? <GridIcon />}
      {rail ? null : (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="bg-brand-soft text-caption text-brand-ink rounded-full px-2 py-0.5">
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );

  return rail ? (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
