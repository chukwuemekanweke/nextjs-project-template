"use client";

import { Tabs } from "@template/ui-core";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  SECURITY_TABS,
  parseSecurityTab,
  securityTabHref,
  type SecurityTab,
} from "./security-tab";

type SecurityTabNavigation = (tab: SecurityTab) => void;

const SecurityTabContext = createContext<SecurityTabNavigation | undefined>(
  undefined,
);

/**
 * Six URL-addressable Security sections. The URL is the only source of
 * truth: the active tab is derived from `?tab=` on every render, so links,
 * soft navigations, refresh and back/forward always agree with what is
 * shown. Switching tabs replaces the query in place (no history entry, no
 * server round trip); the App Router keeps `useSearchParams` in sync with
 * `history.replaceState`. Inactive panels are unmounted, so each tab
 * fetches only its own data.
 */
export function SecurityTabs({
  panels,
}: Readonly<{ panels: Readonly<Record<SecurityTab, ReactNode>> }>) {
  const tab = parseSecurityTab(useSearchParams().get("tab"));

  const selectTab = useCallback((next: SecurityTab) => {
    window.history.replaceState(null, "", securityTabHref(next));
  }, []);

  return (
    <SecurityTabContext value={selectTab}>
      <Tabs<SecurityTab>
        ariaLabel="Security sections"
        items={SECURITY_TABS.map(({ label, value }) => ({
          content: panels[value],
          label,
          value,
        }))}
        onValueChange={selectTab}
        panelClassName="space-y-5 md:space-y-6"
        value={tab}
      />
    </SecurityTabContext>
  );
}

/**
 * In-page link to another Security tab. It is a real link to the tab's URL
 * (works without JavaScript or when opened in a new tab) that switches
 * tabs in place on a plain click.
 */
export function SecurityTabLink({
  children,
  className,
  tab,
}: Readonly<{ children: ReactNode; className?: string; tab: SecurityTab }>) {
  const selectTab = useContext(SecurityTabContext);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !selectTab ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    selectTab(tab);
  }

  return (
    <a className={className} href={securityTabHref(tab)} onClick={navigate}>
      {children}
    </a>
  );
}
