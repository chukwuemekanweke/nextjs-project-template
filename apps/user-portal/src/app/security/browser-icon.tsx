import {
  GlobeIcon,
  IconTile,
  MonitorIcon,
  SmartphoneIcon,
} from "@template/ui-core";
import type { BrowserIconKind } from "./session-display";

// Simplified, recognisable browser marks drawn inline so no logo dependency is
// needed (brand colours are the logos' own, not theme colours). Decorative
// only: the adjacent device label names the browser. Other browsers use a
// themed `IconTile`.

export function BrowserIcon({ kind }: Readonly<{ kind: BrowserIconKind }>) {
  if (kind === "chrome") return <ChromeMark />;
  if (kind === "safari") return <SafariMark />;
  if (kind === "firefox" || kind === "edge") {
    return (
      <IconTile tone="brand">
        <GlobeIcon />
      </IconTile>
    );
  }
  return (
    <IconTile tone="neutral">
      {kind === "mobile" ? <SmartphoneIcon /> : <MonitorIcon />}
    </IconTile>
  );
}

function ChromeMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-10 shrink-0"
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
      className="size-10 shrink-0"
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
