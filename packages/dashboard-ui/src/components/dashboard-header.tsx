import { IconContainer } from "@template/ui-core";
import type { ReactNode } from "react";

/**
 * Page header for dashboard pages: optional icon tile, title, description, and
 * right-aligned actions. It sits directly on the page background, not in a card.
 */
export function DashboardHeader({
  eyebrow,
  icon,
  title,
  description,
  actions,
}: Readonly<{
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4 sm:items-center">
        {icon ? <IconContainer size="lg">{icon}</IconContainer> : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-brand-500 dark:text-brand-400 mb-1 text-xs font-semibold tracking-wider uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl leading-8 font-semibold tracking-tight text-gray-900 sm:text-[28px] sm:leading-9 dark:text-white/90">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
