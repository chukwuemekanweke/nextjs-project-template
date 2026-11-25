import { cn } from "@template/ui-core";
import Link from "next/link";

/**
 * Brand lockup (reference `.logo`): a brand-coloured initial mark, the
 * product name and an optional portal chip ("Admin"). `compact` renders only
 * the mark for the collapsed rail; `size="sm"` is the mobile top-bar size.
 */
export function DashboardBrand({
  badge,
  compact = false,
  href,
  name,
  size = "default",
  subtitle,
}: Readonly<{
  /** Short portal chip after the name, for example "Admin". */
  badge?: string;
  compact?: boolean;
  href: string;
  name: string;
  size?: "default" | "sm";
  /** Optional second line under the name. */
  subtitle?: string;
}>) {
  const small = size === "sm";
  const mark = (
    <span
      aria-hidden="true"
      className={cn(
        "bg-brand text-on-brand grid shrink-0 place-items-center font-bold",
        small
          ? "size-[30px] rounded-[9px] text-[15px]"
          : "size-8 rounded-[9px] text-base",
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );

  if (compact) {
    return (
      <Link aria-label={name} className="rounded-[9px]" href={href}>
        {mark}
      </Link>
    );
  }

  return (
    <Link
      className="text-fg flex min-w-0 items-center gap-2.5 rounded-sm"
      href={href}
    >
      {mark}
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate leading-tight font-bold",
            small ? "text-[17px]" : "text-lg",
          )}
        >
          {name}
        </span>
        {subtitle ? (
          <span className="text-caption text-fg-subtle block truncate font-normal">
            {subtitle}
          </span>
        ) : null}
      </span>
      {badge ? (
        <span className="border-border bg-surface-3 text-fg-muted ml-auto shrink-0 rounded-sm border px-2 py-0.5 text-[11px] leading-4 font-medium">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
