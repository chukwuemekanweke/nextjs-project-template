import type { ReactNode } from "react";
import type { StatusTone } from "@/lib/billing-display";

const toneClasses: Record<StatusTone, string> = {
  danger: "border-red-300 text-red-700 dark:border-red-900 dark:text-red-400",
  info: "border-blue-300 text-blue-700 dark:border-blue-900 dark:text-blue-400",
  neutral:
    "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300",
  success:
    "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
  warning:
    "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
};

export function StatusBadge({
  children,
  tone,
}: Readonly<{ children: ReactNode; tone: StatusTone }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`}
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

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]";
