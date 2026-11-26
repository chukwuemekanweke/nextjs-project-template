import { Button, type ButtonSize, type ButtonVariant } from "@template/ui-core";
import Link from "next/link";
import type { Action } from "../types";

/**
 * A navigation `Action` rendered as a ui-core button-styled link. `variant`
 * overrides the action's own variant (for example a ghost "Sign in").
 */
export function ActionLink({
  action,
  ariaLabel,
  className,
  fullWidth,
  onClick,
  size,
  variant,
}: Readonly<{
  action: Action;
  ariaLabel?: string;
  className?: string;
  fullWidth?: boolean;
  /** Client callers only, for example closing a menu. */
  onClick?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
}>) {
  return (
    <Button
      asChild
      className={className}
      fullWidth={fullWidth}
      size={size}
      variant={variant ?? action.variant ?? "primary"}
    >
      <Link aria-label={ariaLabel} href={action.href} onClick={onClick}>
        {action.label}
      </Link>
    </Button>
  );
}
