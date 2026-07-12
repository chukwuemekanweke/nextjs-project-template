"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarState = {
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  setIsHovered: (value: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarState | undefined>(undefined);

export function SidebarProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isHovered,
        isMobileOpen,
        setIsHovered,
        toggleMobileSidebar: () => setIsMobileOpen((open) => !open),
        toggleSidebar: () => setIsExpanded((expanded) => !expanded),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}
