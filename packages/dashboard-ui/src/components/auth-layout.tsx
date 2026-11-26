import { cn, ThemeSwitch } from "@template/ui-core";
import type { ReactNode } from "react";

/**
 * Split authentication layout (reference `.auth`, `.auth-form`,
 * `.auth-box`, `.auth-art`): a form column with the brand and a theme
 * switch, the flow content centred at the auth-form width, an optional
 * footer, and a decorative brand panel from `lg`. The panel is hidden on
 * phones and tablets. It owns no routes, session or copy: apps pass the
 * brand node, the panel and the page content.
 */
export function AuthLayout({
  brand,
  children,
  footer,
  panel,
}: Readonly<{
  /** Brand lockup, for example `DashboardBrand`. */
  brand: ReactNode;
  children: ReactNode;
  /** Small print under the form, for example the copyright line. */
  footer?: ReactNode;
  /** Brand panel content, usually `AuthPanel`. */
  panel?: ReactNode;
}>) {
  return (
    <div className="bg-surface text-fg flex min-h-dvh">
      <div className="flex min-w-0 flex-1 flex-col px-5 pt-4 pb-6 md:px-12 md:py-8">
        <header className="flex items-center justify-between gap-3">
          {brand}
          <ThemeSwitch className="border-border bg-surface border" />
        </header>
        <main className="max-w-auth-form mx-auto my-auto flex w-full flex-col gap-5 py-7 md:gap-6 md:py-10">
          {children}
        </main>
        {footer ? (
          <footer className="text-small text-fg-subtle">{footer}</footer>
        ) : null}
      </div>
      {panel ? (
        <aside className="bg-auth-panel text-on-brand border-auth-panel-border relative hidden flex-1 flex-col justify-center overflow-hidden border-l p-16 lg:flex">
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.14)_1px,transparent_1px)] bg-size-[22px_22px]"
          />
          <div className="relative flex max-w-110 flex-col gap-5">{panel}</div>
        </aside>
      ) : null}
    </div>
  );
}

export type AuthPanelHighlight = Readonly<{
  icon: ReactNode;
  label: string;
}>;

/** Brand panel copy: a title, a lead and optional short highlights. */
export function AuthPanel({
  description,
  highlights = [],
  title,
}: Readonly<{
  description?: string;
  highlights?: readonly AuthPanelHighlight[];
  title: string;
}>) {
  return (
    <>
      <p className="text-section text-on-brand">{title}</p>
      {description ? (
        <p className="text-on-brand/80 text-lg">{description}</p>
      ) : null}
      {highlights.length > 0 ? (
        <ul className="text-label text-on-brand/90 mt-3 flex flex-wrap gap-5 font-normal">
          {highlights.map((highlight) => (
            <li className="flex items-center gap-2" key={highlight.label}>
              <span aria-hidden="true" className="[&_svg]:size-icon-sm">
                {highlight.icon}
              </span>
              {highlight.label}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/**
 * Heading block of an authentication step: optional icon tile and eyebrow
 * (for example a portal chip), the page `h1` and a supporting description.
 */
export function AuthHeading({
  className,
  description,
  eyebrow,
  icon,
  title,
}: Readonly<{
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /** Decorative icon tile, usually a large `IconTile`. */
  icon?: ReactNode;
  title: string;
}>) {
  return (
    <div className={cn("flex flex-col gap-5 md:gap-6", className)}>
      {icon}
      <div className="flex flex-col items-start gap-2">
        {eyebrow}
        <h1 className="text-h1 text-fg">{title}</h1>
        {description ? (
          <p className="text-body text-fg-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
