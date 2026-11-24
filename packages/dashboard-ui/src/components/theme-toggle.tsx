"use client";

import { MoonIcon, SunIcon } from "@template/ui-core";
import { useEffect } from "react";

const STORAGE_KEY = "theme";

/** Light/dark switch persisted in localStorage, falling back to the OS preference. */
export function ThemeToggle() {
  useEffect(() => {
    const stored = readStoredTheme();
    const dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggleTheme() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Storage can be unavailable (private mode); the toggle still applies.
    }
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
      onClick={toggleTheme}
      type="button"
    >
      <MoonIcon className="h-5 w-5 dark:hidden" />
      <SunIcon className="hidden h-5 w-5 dark:block" />
    </button>
  );
}

function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
