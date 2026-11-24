import Link from "next/link";

/**
 * Sidebar brand lockup: a brand-coloured initial mark plus the product and
 * portal names. `compact` renders only the mark for the collapsed rail.
 */
export function DashboardBrand({
  compact = false,
  href,
  name,
  subtitle,
}: Readonly<{
  compact?: boolean;
  href: string;
  name: string;
  subtitle?: string;
}>) {
  const mark = (
    <span
      aria-hidden="true"
      className="bg-brand-500 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-base font-semibold text-white"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );

  if (compact) {
    return (
      <Link aria-label={name} className="rounded-[10px]" href={href}>
        {mark}
      </Link>
    );
  }

  return (
    <Link className="flex min-w-0 items-center gap-3 rounded-lg" href={href}>
      {mark}
      <span className="min-w-0">
        <span className="block truncate text-[15px] leading-5 font-semibold text-gray-900 dark:text-white/90">
          {name}
        </span>
        {subtitle ? (
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
