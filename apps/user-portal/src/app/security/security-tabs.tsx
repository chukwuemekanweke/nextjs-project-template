"use client";

import { Tabs } from "@template/ui-core";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  SECURITY_TABS,
  securityTabHref,
  type SecurityTab,
} from "./security-tab";

type SecurityTabNavigation = (tab: SecurityTab) => void;

const SecurityTabContext = createContext<SecurityTabNavigation | undefined>(
  undefined,
);

/**
 * Six URL-addressable Security sections. The server page resolves the
 * initial tab from `?tab=`; switching tabs replaces the query in place
 * (no history entry, no server round trip) so the URL stays shareable.
 * Inactive panels are unmounted, so each tab fetches only its own data.
 */
export function SecurityTabs({
  initialTab,
  panels,
}: Readonly<{
  initialTab: SecurityTab;
  panels: Readonly<Record<SecurityTab, ReactNode>>;
}>) {
  const [tab, setTab] = useState(initialTab);
  const [syncedInitialTab, setSyncedInitialTab] = useState(initialTab);

  // A soft navigation to `/security?tab=…` (for example from the dashboard)
  // re-renders the page with a new initial tab while this component persists.
  if (syncedInitialTab !== initialTab) {
    setSyncedInitialTab(initialTab);
    setTab(initialTab);
  }

  const selectTab = useCallback((next: SecurityTab) => {
    setTab(next);
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
