"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SidebarState = {
  /** Desktop sidebar shows labels (expanded) or an icon rail (collapsed). */
  isExpanded: boolean;
  /** Below the `lg` breakpoint the sidebar is an off-canvas drawer. */
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarState | undefined>(undefined);

export function SidebarProvider({
  children,
  defaultExpanded = true,
}: Readonly<{ children: ReactNode; defaultExpanded?: boolean }>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
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
      toggleMobileSidebar,
      toggleSidebar,
    }),
    [
      closeMobileSidebar,
      isExpanded,
      isMobileOpen,
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
