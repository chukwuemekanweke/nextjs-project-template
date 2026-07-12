"use client";

import { useEffect } from "react";
import type { DashboardNavItem } from "../types";
import { useSidebar } from "./sidebar-context";

export function MobileNav({
  brand,
  ariaLabel,
}: Readonly<{
  brand: string;
  items: readonly DashboardNavItem[];
  activeHref: string;
  ariaLabel: string;
}>) {
  const { isExpanded, isMobileOpen, toggleMobileSidebar, toggleSidebar } =
    useSidebar();
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const next = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          aria-expanded={isMobileOpen}
          aria-label={ariaLabel}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 lg:hidden dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
          onClick={toggleMobileSidebar}
          type="button"
        >
          <MenuIcon open={isMobileOpen} />
        </button>
        <button
          aria-expanded={isExpanded}
          aria-label="Toggle sidebar"
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 lg:flex dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
          onClick={toggleSidebar}
          type="button"
        >
          <MenuIcon open={false} />
        </button>
        <span className="font-semibold text-gray-800 lg:hidden dark:text-white/90">
          {brand}
        </span>
      </div>
      <button
        aria-label="Toggle color theme"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={toggleTheme}
        type="button"
      >
        <span aria-hidden="true">◐</span>
      </button>
    </div>
  );
}

function MenuIcon({ open }: Readonly<{ open: boolean }>) {
  return open ? (
    <span className="text-xl">×</span>
  ) : (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path
        d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
