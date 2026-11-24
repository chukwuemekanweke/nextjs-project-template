import type { ReactNode } from "react";

// Outlined 24px icons shared by the authenticated dashboards. They are always
// decorative (aria-hidden); adjacent text or an aria-label carries meaning.
// Size and colour come from the caller's className (defaults to 20px).

export type IconProps = Readonly<{ className?: string }>;

function OutlineIcon({
  children,
  className = "h-5 w-5",
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={["shrink-0", className].join(" ")}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
    </OutlineIcon>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <rect height="7" rx="1.5" width="7" x="3.5" y="3.5" />
      <rect height="7" rx="1.5" width="7" x="13.5" y="3.5" />
      <rect height="7" rx="1.5" width="7" x="3.5" y="13.5" />
      <rect height="7" rx="1.5" width="7" x="13.5" y="13.5" />
    </OutlineIcon>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </OutlineIcon>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </OutlineIcon>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M12 3 19.5 6v5.5c0 4.5-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5-7.5-9.5V6z" />
    </OutlineIcon>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M12 3 19.5 6v5.5c0 4.5-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5-7.5-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </OutlineIcon>
  );
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <rect height="14" rx="2.5" width="19" x="2.5" y="5" />
      <path d="M2.5 10h19M6.5 15h4" />
    </OutlineIcon>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M9.84 5.03 L10.09 2.59 L13.91 2.59 L14.16 5.03 A7.3 7.3 0 0 1 15.41 5.54 L17.30 4.00 L20.00 6.70 L18.46 8.59 A7.3 7.3 0 0 1 18.97 9.84 L21.41 10.09 L21.41 13.91 L18.97 14.16 A7.3 7.3 0 0 1 18.46 15.41 L20.00 17.30 L17.30 20.00 L15.41 18.46 A7.3 7.3 0 0 1 14.16 18.97 L13.91 21.41 L10.09 21.41 L9.84 18.97 A7.3 7.3 0 0 1 8.59 18.46 L6.70 20.00 L4.00 17.30 L5.54 15.41 A7.3 7.3 0 0 1 5.03 14.16 L2.59 13.91 L2.59 10.09 L5.03 9.84 A7.3 7.3 0 0 1 5.54 8.59 L4.00 6.70 L6.70 4.00 L8.59 5.54 A7.3 7.3 0 0 1 9.84 5.03 Z" />
      <circle cx="12" cy="12" r="3" />
    </OutlineIcon>
  );
}

export function KeyIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="7.5" cy="16.5" r="4" />
      <path d="m10.4 13.6 9.1-9.1M16 8l2.5 2.5M18.5 5.5 21 8" />
    </OutlineIcon>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <rect height="10" rx="2" width="15" x="4.5" y="10.5" />
      <path d="M8 10.5v-3a4 4 0 0 1 8 0v3" />
    </OutlineIcon>
  );
}

export function FingerprintIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M4.6 9.2a8 8 0 0 1 14.8 0" />
      <path d="M4.3 13c.1 1.1 0 2.2-.4 3.2" />
      <path d="M7 18.8c.7-1.7 1-3.4 1-5.3V12a4 4 0 0 1 8 0v1.5c0 1.6-.2 3.1-.6 4.5" />
      <path d="M12 12v1.5c0 2.6-.6 5-1.8 7" />
      <path d="M19.7 13c0 2-.3 4-.9 5.8" />
      <path d="M14.5 20.6c.2-.5.3-1 .4-1.5" />
    </OutlineIcon>
  );
}

export function SmartphoneIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <rect height="19" rx="2.5" width="11" x="6.5" y="2.5" />
      <path d="M11.5 18h1" />
    </OutlineIcon>
  );
}

export function LaptopIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <rect height="11" rx="1.5" width="16" x="4" y="5" />
      <path d="M2 19.5h20" />
    </OutlineIcon>
  );
}

export function MonitorIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <rect height="12" rx="1.5" width="18" x="3" y="4" />
      <path d="M8 20h8M12 16v4" />
    </OutlineIcon>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z" />
    </OutlineIcon>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </OutlineIcon>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </OutlineIcon>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" />
      <path d="M3.5 4v4.5H8M12 7.5V12l3 2" />
    </OutlineIcon>
  );
}

export function WifiIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.75 16a5 5 0 0 1 6.5 0" />
      <path d="M12 19.5h.01" />
    </OutlineIcon>
  );
}

export function CircleCheckIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </OutlineIcon>
  );
}

export function CircleAlertIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5M12 16h.01" />
    </OutlineIcon>
  );
}

export function LogOutIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M9 20.5H5.5a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5H9M16 16.5l4.5-4.5L16 7.5M20.5 12H9" />
    </OutlineIcon>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" />
    </OutlineIcon>
  );
}

export function ActivityIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
    </OutlineIcon>
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
      <path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" />
    </OutlineIcon>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </OutlineIcon>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </OutlineIcon>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </OutlineIcon>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </OutlineIcon>
  );
}

export function PanelLeftIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M9 4v16" />
    </OutlineIcon>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="m6 9 6 6 6-6" />
    </OutlineIcon>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="m9 6 6 6-6 6" />
    </OutlineIcon>
  );
}
