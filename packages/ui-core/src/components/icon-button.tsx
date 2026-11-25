import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "../lib/cn";

/** Icon-only button styles (reference `.icon-btn`). */
export const iconButtonVariants = cva(
  [
    "inline-grid shrink-0 place-items-center border transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-icon-md",
  ],
  {
    variants: {
      variant: {
        secondary:
          "border-border bg-surface text-fg-muted hover:bg-hover hover:text-fg",
        ghost:
          "border-transparent bg-transparent text-fg-muted hover:bg-hover hover:text-fg",
      },
      size: {
        default: "size-control rounded-md",
        // 36px visual; keep at least 24px targets (WCAG 2.5.8) around it.
        sm: "size-control-sm rounded-sm",
      },
    },
    defaultVariants: { size: "default", variant: "secondary" },
  },
);

export type IconButtonProps = Omit<
  ComponentPropsWithRef<"button">,
  "aria-label" | "children"
> &
  Readonly<{
    /** Icon from `@template/ui-core` (decorative). */
    icon: ReactNode;
    /** Accessible name; required because the button has no visible text. */
    label: string;
    size?: "default" | "sm";
    variant?: "secondary" | "ghost";
  }>;

/**
 * Icon-only action, for example close, menu or row actions. The `label`
 * becomes the accessible name and the native tooltip.
 */
export function IconButton({
  className,
  icon,
  label,
  size,
  title,
  type,
  variant,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      className={cn(iconButtonVariants({ size, variant }), className)}
      title={title ?? label}
      type={type ?? "button"}
    >
      {icon}
    </button>
  );
}
