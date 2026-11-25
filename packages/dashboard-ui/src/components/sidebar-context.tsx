"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Viewport from which the persistent sidebar replaces the navigation drawer.
 * Mirrors Tailwind's `lg` breakpoint (64rem), used by the `lg:` classes of
 * the shell, sidebar and top bar.
 */
export const DESKTOP_NAVIGATION_MEDIA_QUERY = "(min-width: 64rem)";

type SidebarState = {
  /** Desktop sidebar shows labels (expanded) or an icon rail (collapsed). */
  isExpanded: boolean;
  /** Below the `lg` breakpoint navigation lives in a modal drawer. */
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarState | undefined>(undefined);

export function SidebarProvider({
  children,
  defaultExpanded = true,
  defaultMobileOpen = false,
}: Readonly<{
  children: ReactNode;
  defaultExpanded?: boolean;
  /** Initial drawer state; previews and tests only. Production starts closed. */
  defaultMobileOpen?: boolean;
}>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMobileOpen, setIsMobileOpen] = useState(defaultMobileOpen);

  // Growing into the desktop layout hides the drawer's trigger, so a drawer
  // left open would trap focus behind an invisible control. Close it.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_NAVIGATION_MEDIA_QUERY);
    const closeOnDesktop = () => {
      if (query.matches) setIsMobileOpen(false);
    };
    closeOnDesktop();
    query.addEventListener("change", closeOnDesktop);
    return () => query.removeEventListener("change", closeOnDesktop);
  }, []);

  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
  const openMobileSidebar = useCallback(() => setIsMobileOpen(true), []);
  const toggleMobileSidebar = useCallback(
    () => setIsMobileOpen((open) => !open),
    [],
  );
  const toggleSidebar = useCallback(
    () => setIsExpanded((expanded) => !expanded),
    [],
  );

  const value = useMemo(
    () => ({
      closeMobileSidebar,
      isExpanded,
      isMobileOpen,
      openMobileSidebar,
      toggleMobileSidebar,
      toggleSidebar,
    }),
    [
      closeMobileSidebar,
      isExpanded,
      isMobileOpen,
      openMobileSidebar,
      toggleMobileSidebar,
      toggleSidebar,
    ],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}
