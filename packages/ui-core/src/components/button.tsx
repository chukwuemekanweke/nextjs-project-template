export type ButtonVariant =
  "primary" | "secondary" | "accent" | "destructive" | "danger";

export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

const sizes: Record<ButtonSize, string> = {
  md: "h-10 px-4",
  sm: "h-9 px-3.5",
};

const variants: Record<ButtonVariant, string> = {
  // Solid brand action.
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:outline-brand-500",
  // Neutral outlined action.
  secondary:
    "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5 dark:active:bg-white/10",
  // Brand-tinted secondary action, for example an empty-state call to action.
  accent:
    "border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 active:bg-brand-200 focus-visible:outline-brand-500 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20",
  // Outlined destructive action that opens a confirmation.
  destructive:
    "border border-red-300 bg-white text-red-600 hover:bg-red-50 active:bg-red-100 focus-visible:outline-red-600 dark:border-red-900 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30",
  // Solid destructive confirmation.
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600",
};

/**
 * Class names for dashboard buttons and button-styled links. A function rather
 * than a component so it applies equally to `<button>`, `<a>`, and `<Link>`.
 */
export function buttonClassName({
  className = "",
  size = "md",
  variant = "primary",
}: Readonly<{
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}> = {}): string {
  return [base, sizes[size], variants[variant], className]
    .filter(Boolean)
    .join(" ");
}
