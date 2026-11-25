import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { CircleAlertIcon, RefreshIcon } from "./icons";
import { IconTile } from "./indicators";

/*
 * Empty and error states. They render what the application supplies and call
 * its callbacks; retrying, refetching and navigation stay in the app. Never
 * pass raw exception messages or backend payloads as the description.
 */

/** Placeholder for a list or region that has no items yet. */
export function EmptyState({
  action,
  className,
  description,
  icon,
  secondaryAction,
  title,
}: Readonly<{
  action?: ReactNode;
  className?: string;
  description?: ReactNode;
  icon?: ReactNode;
  secondaryAction?: ReactNode;
  title: ReactNode;
}>) {
  return (
    <div
      className={cn(
        "border-border-strong flex flex-col items-center rounded-md border border-dashed px-6 py-7 text-center",
        className,
      )}
    >
      {icon ? <IconTile>{icon}</IconTile> : null}
      <p className={cn("text-fg font-semibold", icon && "mt-3")}>{title}</p>
      {description ? (
        <p className="text-small text-fg-muted mt-1 max-w-md">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A region that failed to load. Announced as an alert. `onRetry` renders a
 * "Try again" button; `retrying` keeps it busy while the app refetches.
 */
export function ErrorState({
  action,
  className,
  description = "Please try again. If the problem continues, contact support.",
  onRetry,
  retryLabel = "Try again",
  retrying = false,
  title = "Something went wrong",
}: Readonly<{
  /** Alternative action, for example a link back to the dashboard. */
  action?: ReactNode;
  className?: string;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  title?: ReactNode;
}>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-7 text-center",
        className,
      )}
      role="alert"
    >
      <IconTile tone="danger">
        <CircleAlertIcon />
      </IconTile>
      <p className="text-fg mt-3 font-semibold">{title}</p>
      {description ? (
        <p className="text-small text-fg-muted mt-1 max-w-md">{description}</p>
      ) : null}
      {onRetry || action ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button
              leadingIcon={<RefreshIcon />}
              loading={retrying}
              onClick={onRetry}
              size="sm"
              variant="secondary"
            >
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
