import { IconTile } from "@template/ui-core";
import type { ReactNode } from "react";

/**
 * Page heading for dashboard pages (reference `.page-head`): optional icon
 * tile and eyebrow, the page `h1`, a description, and right-aligned actions
 * that stack under the heading on phones. It sits directly on the page
 * background inside the shell's content area — the application top bar is
 * `DashboardTopbar`.
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
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4 sm:items-center">
        {icon ? <IconTile size="lg">{icon}</IconTile> : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="eyebrow text-brand-ink mb-1">{eyebrow}</p>
          ) : null}
          <h1 className="text-h1 text-fg break-words">{title}</h1>
          {description ? (
            <p className="text-fg-muted mt-1.5 max-w-3xl">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3 max-sm:*:flex-auto">{actions}</div>
      ) : null}
    </div>
  );
}
