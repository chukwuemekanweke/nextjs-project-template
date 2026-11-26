"use client";

import {
  ChevronRightIcon,
  CloseIcon,
  cn,
  DarkModeSwitch,
  Drawer,
  DrawerClose,
  IconButton,
  MenuIcon,
  ThemeSwitch,
} from "@template/ui-core";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Action, LinkItem } from "../types";
import { ActionLink } from "./action-link";

export const MARKETING_MENU_ID = "marketing-mobile-menu";

/** The full navigation shows from `lg`; below it the menu sheet takes over. */
const DESKTOP_QUERY = "(min-width: 64rem)";

type HeaderProps = Readonly<{
  /** The current navigation href, marked with `aria-current="page"`. */
  activeHref?: string;
  /** Brand lockup linking home (the app supplies its configured logo). */
  brand: ReactNode;
  navigation: readonly LinkItem[];
  register: Action;
  signIn: Action;
}>;

/**
 * Marketing top bar (reference `.pub-nav` / `.m-top`). From `lg`: brand,
 * site navigation, theme switch, Sign in and Get started. Below `lg`: brand,
 * Get started and a menu button opening `MarketingMobileMenu`.
 */
export function MarketingHeader({
  activeHref,
  brand,
  navigation,
  register,
  signIn,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Growing into the desktop layout hides the menu button, so close the sheet.
  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    query.addEventListener("change", closeOnDesktop);
    return () => query.removeEventListener("change", closeOnDesktop);
  }, [menuOpen]);

  return (
    <header className="border-border bg-surface z-sticky sticky top-0 border-b">
      <div className="min-h-topbar-mobile flex items-center gap-3 px-4 py-2.5 md:px-8 lg:gap-6 lg:px-12 lg:py-4.5">
        <div className="flex min-w-0 shrink-0 items-center">{brand}</div>
        <nav aria-label="Site" className="hidden flex-1 gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              aria-current={item.href === activeHref ? "page" : undefined}
              className={cn(
                "text-fg-muted hover:bg-hover hover:text-fg rounded-sm px-3.5 py-2.5 font-medium transition-colors",
                "aria-[current=page]:text-fg",
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeSwitch />
          <ActionLink action={signIn} variant="ghost" />
          <ActionLink action={register} />
        </div>
        <div className="ml-auto flex items-center gap-3 lg:hidden">
          <ActionLink action={register} size="sm" />
          <IconButton
            aria-controls={menuOpen ? MARKETING_MENU_ID : undefined}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            icon={<MenuIcon />}
            label="Open menu"
            onClick={() => setMenuOpen(true)}
          />
        </div>
      </div>
      <MarketingMobileMenu
        activeHref={activeHref}
        brand={brand}
        navigation={navigation}
        onOpenChange={setMenuOpen}
        open={menuOpen}
        register={register}
        signIn={signIn}
      />
    </header>
  );
}

/**
 * Full-screen site menu below `lg` (reference `PublicMobileMenu`): brand and
 * close button, the site navigation, Get started, Sign in and a Dark mode
 * switch. Built on the ui-core `Drawer` (Radix Dialog): focus is trapped and
 * returned to the menu button, the page behind is inert and does not
 * scroll, and Escape, the close button or choosing a link closes it.
 */
export function MarketingMobileMenu({
  activeHref,
  brand,
  navigation,
  onOpenChange,
  open,
  register,
  signIn,
}: HeaderProps &
  Readonly<{ onOpenChange: (open: boolean) => void; open: boolean }>) {
  const close = () => onOpenChange(false);

  return (
    <Drawer
      className="w-full lg:hidden"
      id={MARKETING_MENU_ID}
      onOpenChange={onOpenChange}
      open={open}
      side="right"
      title="Site menu"
    >
      <div className="border-border min-h-topbar-mobile flex items-center justify-between gap-3 border-b px-4 py-2.5 md:px-8">
        <div className="flex min-w-0 items-center">{brand}</div>
        <DrawerClose asChild>
          <IconButton icon={<CloseIcon />} label="Close menu" />
        </DrawerClose>
      </div>
      <nav aria-label="Site" className="flex flex-col px-5 py-2 md:px-8">
        {navigation.map((item) => (
          <Link
            aria-current={item.href === activeHref ? "page" : undefined}
            className="border-border text-fg aria-[current=page]:text-brand-ink flex items-center justify-between gap-3 border-b px-1 py-4 text-xl font-medium"
            href={item.href}
            key={item.href}
            onClick={close}
          >
            {item.label}
            <ChevronRightIcon className="text-fg-subtle" />
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3 p-5 md:px-8">
        <ActionLink action={register} fullWidth onClick={close} />
        <ActionLink
          action={signIn}
          fullWidth
          onClick={close}
          variant="secondary"
        />
        <DarkModeSwitch className="pt-2" />
      </div>
    </Drawer>
  );
}
