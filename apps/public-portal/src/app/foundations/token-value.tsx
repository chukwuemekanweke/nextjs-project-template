"use client";

import { useSyncExternalStore } from "react";

// Reads the live computed value of a CSS custom property from <html>, so the
// preview shows what theme.css actually resolves to in the current theme.
function subscribeToThemeClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["class", "style"],
    attributes: true,
  });
  return () => observer.disconnect();
}

export function TokenValue({ token }: Readonly<{ token: string }>) {
  const value = useSyncExternalStore(
    subscribeToThemeClass,
    () =>
      getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    () => "",
  );

  return (
    <span className="text-mono text-fg-subtle block truncate font-mono">
      {value || token}
    </span>
  );
}
