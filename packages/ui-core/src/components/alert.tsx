"use client";

import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CloseIcon,
  InfoIcon,
  TriangleAlertIcon,
  type IconComponent,
} from "./icons";

export type AlertVariant = "error" | "info" | "success" | "warning";

const EXIT_DURATION_MS = 300;

const variantClasses: Record<AlertVariant, string> = {
  error: "bg-danger-bg",
  info: "bg-info-bg",
  success: "bg-success-bg",
  warning: "bg-warning-bg",
};

const iconClasses: Record<AlertVariant, string> = {
  error: "text-danger",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
};

const variantIcons: Record<AlertVariant, IconComponent> = {
  error: CircleAlertIcon,
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
};

/**
 * Inline feedback (reference `.alert`, `.a-info/ok/warn/bad`). Errors and
 * warnings use `role="alert"`; information and success use a polite
 * `role="status"`. Each tone has its own icon, so meaning never depends on
 * colour alone. `onDismiss` adds a labelled close button; `autoDismissAfter`
 * (ms, requires `onDismiss`) removes the alert after a delay.
 */
export function Alert({
  action,
  autoDismissAfter,
  children,
  className,
  dismissLabel = "Dismiss alert",
  hideIcon = false,
  onDismiss,
  title,
  variant = "info",
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "role" | "title"> & {
  /** Inline action, for example a "Retry" button or a link. */
  action?: ReactNode;
  autoDismissAfter?: number;
  children: ReactNode;
  dismissLabel?: string;
  hideIcon?: boolean;
  onDismiss?: () => void;
  title?: ReactNode;
  variant?: AlertVariant;
}) {
  const [closing, setClosing] = useState(false);
  const manualDismissTimer = useRef<number | null>(null);
  const Icon = variantIcons[variant];

  useEffect(() => {
    if (!onDismiss || !autoDismissAfter || autoDismissAfter < 1) {
      return;
    }

    const closeTimer = window.setTimeout(
      () => setClosing(true),
      autoDismissAfter,
    );
    const removeTimer = window.setTimeout(
      onDismiss,
      autoDismissAfter + EXIT_DURATION_MS,
    );
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [autoDismissAfter, onDismiss]);

  useEffect(
    () => () => {
      if (manualDismissTimer.current !== null) {
        window.clearTimeout(manualDismissTimer.current);
      }
    },
    [],
  );

  function dismiss() {
    if (!onDismiss || closing) {
      return;
    }

    setClosing(true);
    manualDismissTimer.current = window.setTimeout(onDismiss, EXIT_DURATION_MS);
  }

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        closing
          ? "-translate-y-1 grid-rows-[0fr] opacity-0"
          : "grid-rows-[1fr] opacity-100",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          {...props}
          className={cn(
            "text-label text-fg flex items-start gap-3 rounded-lg px-4 py-3.5 font-normal max-md:flex-wrap",
            variantClasses[variant],
          )}
          role={
            variant === "error" || variant === "warning" ? "alert" : "status"
          }
        >
          {hideIcon ? null : (
            <Icon className={cn("mt-px", iconClasses[variant])} />
          )}
          <div className="min-w-0 flex-1">
            {title ? <p className="font-semibold">{title}</p> : null}
            <div className={cn(title ? "text-fg-muted mt-0.5" : undefined)}>
              {children}
            </div>
          </div>
          {action ? <div className="shrink-0 self-center">{action}</div> : null}
          {onDismiss ? (
            <button
              aria-label={dismissLabel}
              className="text-fg-muted hover:bg-hover hover:text-fg focus-visible:outline-focus -m-1 shrink-0 rounded-sm p-1 transition-colors focus-visible:outline-2"
              onClick={dismiss}
              type="button"
            >
              <CloseIcon size="xs" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
