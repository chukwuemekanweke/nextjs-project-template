// Billing-specific decorative icon with no `@template/ui-core` equivalent.
// Always aria-hidden; the adjacent text carries the meaning.

/** Bank building, for bank-transfer payment methods. */
export function BankIcon({
  className = "size-5",
}: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M3 9.5 12 4l9 5.5M4.5 9.5h15M5.5 20h13M3.5 20h17" />
      <path d="M7 12.5v5M10.3 12.5v5M13.7 12.5v5M17 12.5v5" />
    </svg>
  );
}
