import type { ReactNode } from "react";

// Small decorative icons for checkout and payment results. They are always
// aria-hidden; the adjacent text carries the meaning.

type IconProps = Readonly<{ className?: string }>;

function StrokeIcon({
  children,
  className,
  strokeWidth = 1.75,
}: Readonly<{ children: ReactNode; className: string; strokeWidth?: number }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function PaymentCardIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect height="14" rx="2.5" width="19" x="2.5" y="5" />
      <path d="M2.5 10h19M6.5 15h4" />
    </StrokeIcon>
  );
}

export function BankIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M3 9.5 12 4l9 5.5M4.5 9.5h15M5.5 20h13M3.5 20h17" />
      <path d="M7 12.5v5M10.3 12.5v5M13.7 12.5v5M17 12.5v5" />
    </StrokeIcon>
  );
}

export function LockIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect height="10" rx="2" width="15" x="4.5" y="10.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </StrokeIcon>
  );
}

export function InfoIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </StrokeIcon>
  );
}

export function RenewIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20v-4h-4" />
    </StrokeIcon>
  );
}

export function ArrowRightIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <StrokeIcon className={className} strokeWidth={2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </StrokeIcon>
  );
}

export function ExternalLinkIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <StrokeIcon className={className} strokeWidth={2}>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </StrokeIcon>
  );
}

export function CheckIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <StrokeIcon className={className} strokeWidth={2.5}>
      <path d="M5 12.5 10 17.5 19 7" />
    </StrokeIcon>
  );
}

export function CancelCircleIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <StrokeIcon className={className} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </StrokeIcon>
  );
}

export function ClockIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <StrokeIcon className={className} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </StrokeIcon>
  );
}

export function AlertIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <StrokeIcon className={className} strokeWidth={2}>
      <path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </StrokeIcon>
  );
}

export function SpinnerIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin motion-reduce:animate-none ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-30"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}
