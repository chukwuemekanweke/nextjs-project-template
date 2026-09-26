"use client";

import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "default",
}: Readonly<{
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  size?: "compact" | "default";
}>) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-400/50 p-4 backdrop-blur-[32px]"
      role="dialog"
    >
      <div
        className={[
          "shadow-theme-lg w-full rounded-3xl bg-white p-6 dark:bg-gray-900",
          size === "compact" ? "max-w-md" : "max-w-xl",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Close dialog"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            onClick={onClose}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
        <div className="mt-6">{children}</div>
        {footer ? (
          <div className="mt-6 flex flex-wrap gap-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
