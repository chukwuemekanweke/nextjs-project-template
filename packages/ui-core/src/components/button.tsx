import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./spinner";

/**
 * Button styles (reference `.btn`, `.btn-p/s/g/d/dg`, `.btn-sm`,
 * `.btn-block`). Exported so links and other elements can look like buttons
 * without a wrapper: `<Link className={buttonVariants({ variant: "secondary" })}>`.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 border border-transparent font-medium whitespace-nowrap no-underline transition-colors select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:pointer-events-none disabled:opacity-50",
    // Disabled links (asChild); a loading button stays opaque with a spinner.
    "aria-disabled:pointer-events-none aria-disabled:not-aria-busy:opacity-50",
    "[&_svg]:size-icon-sm",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-press",
        secondary:
          "border-border-strong bg-surface text-fg hover:bg-hover active:bg-surface-3",
        ghost:
          "bg-transparent text-fg-muted hover:bg-hover hover:text-fg active:bg-surface-3",
        danger:
          "bg-danger-solid text-on-danger hover:bg-danger-solid/90 active:bg-danger-solid/80",
        dangerOutline:
          "border-border-strong bg-transparent text-danger hover:bg-danger-bg active:bg-danger-bg",
      },
      size: {
        default: "min-h-control rounded-md px-[18px] text-body",
        sm: "min-h-control-sm rounded-sm px-3 text-label",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      fullWidth: false,
      size: "default",
      variant: "primary",
    },
  },
);

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>;
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>["size"]
>;

export type ButtonProps = ComponentPropsWithRef<"button"> &
  Readonly<{
    /**
     * Render the single child element (for example a Next.js `Link`) with
     * button styles instead of a `<button>`. Use for navigation that looks
     * like a button; never nest a button inside a link.
     */
    asChild?: boolean;
    fullWidth?: boolean;
    leadingIcon?: ReactNode;
    /**
     * Shows a spinner, sets `aria-busy` and ignores further clicks (including
     * form submission) while keeping the button focusable.
     */
    loading?: boolean;
    size?: ButtonSize;
    trailingIcon?: ReactNode;
    variant?: ButtonVariant;
  }>;

export function Button({
  asChild = false,
  children,
  className,
  disabled,
  fullWidth,
  leadingIcon,
  loading = false,
  onClick,
  size,
  trailingIcon,
  type,
  variant,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ fullWidth, size, variant }), className);
  const leading = loading ? <Spinner decorative size="sm" /> : leadingIcon;

  if (asChild) {
    return (
      <Slot.Root
        {...props}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        className={classes}
      >
        {leading}
        <Slot.Slottable>{children}</Slot.Slottable>
        {trailingIcon}
      </Slot.Root>
    );
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      // Blocks repeated activation and implicit form submission.
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={classes}
      disabled={disabled}
      // Attached only when needed so static buttons stay renderable from
      // Server Components (which cannot pass functions to DOM elements).
      onClick={loading || onClick ? handleClick : undefined}
      type={type ?? "button"}
    >
      {leading}
      {children}
      {trailingIcon}
    </button>
  );
}

/** @deprecated Legacy variant names; use `ButtonVariant` with `Button`. */
export type LegacyButtonVariant =
  "primary" | "secondary" | "accent" | "destructive" | "danger";

const legacyVariants: Record<LegacyButtonVariant, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  // The brand-tinted accent has no reference counterpart (DR-078).
  accent: "secondary",
  destructive: "dangerOutline",
  danger: "danger",
};

/**
 * @deprecated Use `Button` or `buttonVariants`. Kept for existing consumers
 * (FE-UI-032 removes it); the classes now come from `buttonVariants`.
 */
export function buttonClassName({
  className = "",
  size = "md",
  variant = "primary",
}: Readonly<{
  className?: string;
  size?: "sm" | "md";
  variant?: LegacyButtonVariant;
}> = {}): string {
  return cn(
    buttonVariants({
      size: size === "sm" ? "sm" : "default",
      variant: legacyVariants[variant],
    }),
    className,
  );
}
