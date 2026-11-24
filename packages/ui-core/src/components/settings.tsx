import type { ReactNode } from "react";

export type StatusTone = "success" | "danger" | "warning" | "info" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-500/10 dark:text-green-400",
  danger:
    "border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-500/10 dark:text-red-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-500/10 dark:text-amber-400",
  info: "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300",
  neutral:
    "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300",
};

/** Compact status pill. The text itself must carry the meaning, not the colour. */
export function StatusBadge({
  children,
  className = "",
  tone = "neutral",
}: Readonly<{ children: ReactNode; className?: string; tone?: StatusTone }>) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs leading-5 font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/** Subtle brand-tinted square that frames a page or section icon. */
export function IconContainer({
  children,
  className = "",
  size = "md",
}: Readonly<{
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
}>) {
  return (
    <span
      aria-hidden="true"
      className={[
        "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 flex shrink-0 items-center justify-center",
        size === "lg" ? "h-12 w-12 rounded-xl" : "h-11 w-11 rounded-[10px]",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/**
 * Card-level heading with an optional icon, description, and right-aligned
 * actions. Actions stack full-width on small screens.
 */
export function SectionHeader({
  actions,
  description,
  headingLevel = 2,
  icon,
  title,
}: Readonly<{
  actions?: ReactNode;
  description?: ReactNode;
  headingLevel?: 2 | 3;
  icon?: ReactNode;
  title: ReactNode;
}>) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {icon ? <IconContainer>{icon}</IconContainer> : null}
        <div className="min-w-0">
          <Heading className="text-lg leading-7 font-semibold text-gray-900 dark:text-white/90">
            {title}
          </Heading>
          {description ? (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 *:w-full sm:flex-row sm:*:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Bordered row nested inside a settings card: a label and description on the
 * left with actions aligned right on wider screens.
 */
export function SettingsRow({
  actions,
  children,
  className = "",
  description,
  title,
}: Readonly<{
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}>) {
  return (
    <div
      className={[
        "flex flex-col gap-4 rounded-[10px] border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-gray-800",
        className,
      ].join(" ")}
    >
      <div className="min-w-0 space-y-1">
        {title ? (
          <div className="text-[15px] leading-6 font-semibold text-gray-900 dark:text-white/90">
            {title}
          </div>
        ) : null}
        {description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 *:w-full sm:flex-row sm:*:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Dashed placeholder for a list that has no items yet. */
export function EmptyState({
  action,
  description,
  icon,
  title,
}: Readonly<{
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center rounded-[10px] border border-dashed border-gray-300 px-6 py-7 text-center dark:border-gray-700">
      {icon ? (
        <span aria-hidden="true" className="text-brand-500 dark:text-brand-400">
          {icon}
        </span>
      ) : null}
      <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white/90">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
