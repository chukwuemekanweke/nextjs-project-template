import type { ReactNode } from "react";
import type { StatusTone } from "@/lib/billing-display";

const toneClasses: Record<StatusTone, string> = {
  danger: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  info: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  neutral: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

/** Subtle filled status pill. The text label always carries the meaning. */
export function StatusBadge({
  children,
  tone,
}: Readonly<{ children: ReactNode; tone: StatusTone }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`}
      data-tone={tone}
    >
      {children}
    </span>
  );
}

export function DetailList({
  items,
}: Readonly<{
  items: ReadonlyArray<Readonly<{ label: string; value: ReactNode }>>;
}>) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(({ label, value }) => (
        <div className="min-w-0" key={label}>
          <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            {label}
          </dt>
          <dd className="mt-1 text-sm break-words text-gray-800 dark:text-white/90">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const primaryButtonClass =
  "bg-brand-500 hover:bg-brand-600 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

/** The Profile "Save changes" blue, sized for checkout and payment results. */
export const largePrimaryButtonClass =
  "bg-brand-500 hover:bg-brand-600 focus-visible:ring-brand-500/40 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold text-white shadow-theme-xs transition focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-gray-900";

export const textLinkClass =
  "text-brand-500 hover:text-brand-600 dark:text-brand-400 focus-visible:ring-brand-500/40 rounded-md px-2 py-1 text-base font-semibold focus-visible:ring-3 focus-visible:outline-none";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]";
