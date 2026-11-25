import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconTile } from "./indicators";

/*
 * Settings-page compositions that predate the design-system primitives. They
 * now use semantic tokens; new code should prefer `CardHeader`, `ListRow` and
 * `IconTile` (FE-UI-032 removes these once their consumers migrate).
 */

/** @deprecated Use `IconTile`. */
export function IconContainer({
  children,
  className,
  size = "md",
}: Readonly<{
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
}>) {
  return (
    <IconTile className={className} size={size}>
      {children}
    </IconTile>
  );
}

/**
 * @deprecated Use `CardHeader` + `CardTitle`. Card-level heading with an
 * optional icon, description, and right-aligned actions (stacked on phones).
 */
export function SectionHeader({
  actions,
  description,
  headingLevel = 2,
  icon,
  title,
}: Readonly<{
  actions?: ReactNode;
  description?: ReactNode;
  headingLevel?: 2 | 3;
  icon?: ReactNode;
  title: ReactNode;
}>) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {icon ? <IconTile>{icon}</IconTile> : null}
        <div className="min-w-0">
          <Heading className="text-h2 text-fg">{title}</Heading>
          {description ? (
            <p className="text-small text-fg-muted mt-0.5">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 *:w-full sm:flex-row sm:*:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/**
 * @deprecated Use `ListRow`. Bordered row nested inside a settings card: a
 * label and description on the left with actions aligned right on wider
 * screens.
 */
export function SettingsRow({
  actions,
  children,
  className,
  description,
  title,
}: Readonly<{
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}>) {
  return (
    <div
      className={cn(
        "border-border flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {title ? <div className="text-fg font-semibold">{title}</div> : null}
        {description ? (
          <p className="text-small text-fg-muted">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 *:w-full sm:flex-row sm:*:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
