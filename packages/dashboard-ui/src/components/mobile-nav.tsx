"use client";

import { CloseIcon, Drawer, DrawerClose, IconButton } from "@template/ui-core";
import type { ReactNode } from "react";
import { useSidebar } from "./sidebar-context";

export const MOBILE_NAV_DRAWER_ID = "dashboard-mobile-nav";

/**
 * Navigation drawer below `lg` (reference `.m-drawer`, 304px, capped at
 * 86% of the viewport): brand and close button, optional `header` (account
 * summary), the navigation, and a `footer` (dark-mode switch, sign out).
 *
 * Opened by the top-bar menu button and closed by the close button, Escape,
 * the scrim, selecting a navigation item, or growing into the desktop
 * layout. While open, focus is trapped, the page behind is inert and does
 * not scroll; on close focus returns to the menu button.
 */
export function MobileNavDrawer({
  brand,
  children,
  footer,
  header,
  title = "Menu",
}: Readonly<{
  brand: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  /** Accessible name of the drawer (reference `aria-label="Menu"`). */
  title?: string;
}>) {
  const { closeMobileSidebar, isMobileOpen, openMobileSidebar } = useSidebar();

  return (
    <Drawer
      className="border-border bg-nav-bg w-nav-drawer max-w-[86vw] gap-4 border-r p-4 lg:hidden"
      id={MOBILE_NAV_DRAWER_ID}
      onOpenChange={(open) =>
        open ? openMobileSidebar() : closeMobileSidebar()
      }
      open={isMobileOpen}
      side="left"
      title={title}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center">{brand}</div>
        <DrawerClose asChild>
          <IconButton icon={<CloseIcon />} label="Close menu" />
        </DrawerClose>
      </div>
      {header}
      {children}
      {footer ? (
        <div className="border-border mt-auto flex flex-col gap-2 border-t pt-4">
          {footer}
        </div>
      ) : null}
    </Drawer>
  );
}
