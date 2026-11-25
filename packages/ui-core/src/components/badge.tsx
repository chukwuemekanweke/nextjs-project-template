import { cva } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Semantic tones shared by badges, alerts and icon tiles. Applications map
 * their domain statuses (payment, subscription, session …) to a tone; the
 * mapping never lives in `ui-core`.
 */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

/** @deprecated Alias of `BadgeTone`, kept for existing consumers. */
export type StatusTone = BadgeTone;

/** Status pill styles (reference `.badge`, `.b-ok/warn/bad/info`). */
export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.78125rem] leading-5 font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-neutral-bg text-neutral",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        danger: "bg-danger-bg text-danger",
        info: "bg-info-bg text-info",
      },
      dot: {
        true: "before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']",
        false: "",
      },
    },
    defaultVariants: { dot: true, tone: "neutral" },
  },
);

/**
 * Compact status label. The text must carry the meaning; tone and dot only
 * reinforce it (never rely on colour alone).
 */
export function Badge({
  className,
  dot = true,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> &
  Readonly<{ dot?: boolean; tone?: BadgeTone }>) {
  return (
    <span className={cn(badgeVariants({ dot, tone }), className)} {...props} />
  );
}

/**
 * @deprecated Use `Badge`. Same props as before; now renders the reference
 * badge (with status dot).
 */
export function StatusBadge({
  children,
  className,
  tone = "neutral",
}: Readonly<{ children: ReactNode; className?: string; tone?: StatusTone }>) {
  return (
    <Badge className={className} tone={tone}>
      {children}
    </Badge>
  );
}
