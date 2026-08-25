"use client";

import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type AlertVariant = "error" | "info" | "success" | "warning";

const EXIT_DURATION_MS = 300;

const variantClasses: Record<AlertVariant, string> = {
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
};

export function Alert({
  autoDismissAfter,
  children,
  className = "",
  dismissLabel = "Dismiss alert",
  onDismiss,
  variant = "info",
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  autoDismissAfter?: number;
  children: ReactNode;
  dismissLabel?: string;
  onDismiss?: () => void;
  variant?: AlertVariant;
}) {
  const [closing, setClosing] = useState(false);
  const manualDismissTimer = useRef<number | null>(null);

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
      className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
        closing
          ? "-translate-y-1 grid-rows-[0fr] opacity-0"
          : "grid-rows-[1fr] opacity-100"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          {...props}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${variantClasses[variant]}`}
          role={
            variant === "error" || variant === "warning" ? "alert" : "status"
          }
        >
          <div className="min-w-0">{children}</div>
          {onDismiss ? (
            <button
              aria-label={dismissLabel}
              className="-m-1 shrink-0 rounded-md p-1 opacity-70 transition hover:opacity-100 focus:ring-2 focus:ring-current focus:outline-none"
              onClick={dismiss}
              type="button"
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="16"
                viewBox="0 0 16 16"
                width="16"
              >
                <path
                  d="m4 4 8 8m0-8-8 8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
