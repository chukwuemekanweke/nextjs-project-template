import { GlobeIcon, MonitorIcon, SmartphoneIcon } from "@template/ui-core";
import type { BrowserIconKind } from "./session-display";

// Simplified, recognisable browser marks drawn inline so no logo dependency is
// needed. Decorative only: the adjacent device label names the browser.

export function BrowserIcon({ kind }: Readonly<{ kind: BrowserIconKind }>) {
  if (kind === "chrome") return <ChromeMark />;
  if (kind === "safari") return <SafariMark />;
  if (kind === "firefox") {
    return (
      <IconTile className="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
        <GlobeIcon />
      </IconTile>
    );
  }
  if (kind === "edge") {
    return (
      <IconTile className="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
        <GlobeIcon />
      </IconTile>
    );
  }
  return (
    <IconTile className="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
      {kind === "mobile" ? <SmartphoneIcon /> : <MonitorIcon />}
    </IconTile>
  );
}

function IconTile({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className: string }>) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}
    >
      {children}
    </span>
  );
}

function ChromeMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-9 w-9 shrink-0"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="M12 12 3.34 7A10 10 0 0 1 20.66 7Z" fill="#EA4335" />
      <path d="M12 12 20.66 7A10 10 0 0 1 12 22Z" fill="#FBBC05" />
      <path d="M12 12 12 22A10 10 0 0 1 3.34 7Z" fill="#34A853" />
      <circle cx="12" cy="12" fill="#fff" r="4.6" />
      <circle cx="12" cy="12" fill="#4285F4" r="3.6" />
    </svg>
  );
}

function SafariMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-9 w-9 shrink-0"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" fill="#1E88E5" r="10" />
      <circle cx="12" cy="12" fill="#fff" r="8.2" />
      <path d="m16.5 7.5-5.6 3.4 2.2 2.2Z" fill="#EF4444" />
      <path d="m7.5 16.5 3.4-5.6 2.2 2.2Z" fill="#94A3B8" />
    </svg>
  );
}
