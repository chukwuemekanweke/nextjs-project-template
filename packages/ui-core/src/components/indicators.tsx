import { cva } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { CloseIcon } from "./icons";

/* ------------------------------------------------------------------------ */
/* Chip                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Neutral tag (reference `.chip`): categories, roles, active filters. With
 * `onRemove` it renders a labelled remove button (client usage only).
 */
export function Chip({
  children,
  className,
  onRemove,
  removeLabel,
  ...props
}: HTMLAttributes<HTMLSpanElement> &
  Readonly<{
    children: ReactNode;
    onRemove?: () => void;
    /** Accessible name of the remove button, for example "Remove Admin". */
    removeLabel?: string;
  }>) {
  return (
    <span
      className={cn(
        "border-border bg-surface-3 text-small text-fg-muted inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-medium",
        onRemove && "pr-1",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          aria-label={removeLabel ?? "Remove"}
          className="text-fg-subtle hover:bg-hover hover:text-fg focus-visible:outline-focus -my-0.5 inline-grid size-5 place-items-center rounded-[6px] focus-visible:outline-2"
          onClick={onRemove}
          type="button"
        >
          <CloseIcon className="size-3.5" />
        </button>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* IconTile                                                                  */
/* ------------------------------------------------------------------------ */

export const iconTileVariants = cva("inline-grid shrink-0 place-items-center", {
  variants: {
    tone: {
      brand: "bg-brand-soft text-brand-ink",
      neutral: "bg-neutral-bg text-neutral",
      success: "bg-success-bg text-success",
      warning: "bg-warning-bg text-warning",
      danger: "bg-danger-bg text-danger",
    },
    size: {
      sm: "size-8 rounded-sm [&_svg]:size-icon-xs",
      md: "size-10 rounded-md [&_svg]:size-icon-md",
      lg: "size-12 rounded-lg [&_svg]:size-6",
    },
  },
  defaultVariants: { size: "md", tone: "brand" },
});

export type IconTileTone =
  "brand" | "neutral" | "success" | "warning" | "danger";

/** Tinted square framing a decorative icon (reference `.ico`). */
export function IconTile({
  children,
  className,
  size = "md",
  tone = "brand",
}: Readonly<{
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: IconTileTone;
}>) {
  return (
    <span
      aria-hidden="true"
      className={cn(iconTileVariants({ size, tone }), className)}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Progress                                                                  */
/* ------------------------------------------------------------------------ */

export type ProgressTone = "brand" | "success" | "warning" | "danger";

const progressTones: Record<ProgressTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * Determinate progress bar (reference `.progress`) with `progressbar`
 * semantics. `label` names it for assistive technology; `valueText` replaces
 * the percentage announcement (for example "12 of 30 days").
 */
export function Progress({
  className,
  label,
  max = 100,
  tone = "brand",
  value,
  valueText,
}: Readonly<{
  className?: string;
  label: string;
  max?: number;
  tone?: ProgressTone;
  value: number;
  valueText?: string;
}>) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={clamped}
      aria-valuetext={valueText}
      className={cn(
        "bg-surface-3 h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      role="progressbar"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          progressTones[tone],
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Divider                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Separator line (reference `.divider`), or a labelled separator such as the
 * sign-in "or" (reference `.or`) when `label` is given.
 */
export function Divider({
  className,
  label,
  orientation = "horizontal",
}: Readonly<{
  className?: string;
  label?: ReactNode;
  orientation?: "horizontal" | "vertical";
}>) {
  if (label) {
    return (
      <div
        className={cn(
          "text-small text-fg-subtle flex items-center gap-3",
          className,
        )}
      >
        <span aria-hidden="true" className="bg-border h-px flex-1" />
        <span>{label}</span>
        <span aria-hidden="true" className="bg-border h-px flex-1" />
      </div>
    );
  }

  return (
    <div
      aria-orientation={orientation}
      className={cn(
        "bg-border shrink-0",
        orientation === "vertical" ? "w-px self-stretch" : "h-px w-full",
        className,
      )}
      role="separator"
    />
  );
}
