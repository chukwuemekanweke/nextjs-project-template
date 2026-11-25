import { Fragment, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { TrendingDownIcon, TrendingUpIcon } from "./icons";
import { IconTile } from "./indicators";

/*
 * Surfaces (reference `.card`, `.card-h`, `.card-b`, `.card-f`, `.soft`,
 * `.stat`, `.kv`, `.list-row`). All are server-compatible and composable:
 * `Card` > `CardHeader` / `CardContent` / `CardFooter`, with lists and
 * key-value pairs placed inside. Paddings shrink below `md` (phone).
 */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border bg-surface rounded-xl border shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

/** Header row with a bottom border: title on the left, actions on the right. */
export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5 md:px-6 md:py-[18px]",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  as: Heading = "h2",
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & Readonly<{ as?: "h2" | "h3" | "h4" }>) {
  return <Heading className={cn("text-h3 text-fg", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-small text-fg-muted mt-0.5", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-card", className)} {...props} />;
}

/** Footer actions, right-aligned; buttons share the width on phones. */
export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border flex flex-wrap items-center justify-end gap-3 border-t px-4 py-3.5 max-md:*:flex-auto md:px-6 md:py-4",
        className,
      )}
      {...props}
    />
  );
}

/** Soft, tinted panel for secondary content inside a card (reference `.soft`). */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border bg-surface-2 rounded-lg border p-4",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* Statistics                                                                */
/* ------------------------------------------------------------------------ */

export type StatTrend = "up" | "down" | "neutral";

/**
 * Statistic tile (reference `.stat`): label, value and an optional change.
 * The delta text must state the direction ("+12% vs last month"); its icon
 * and colour only reinforce it. The icon tile is hidden on phones.
 */
export function Stat({
  className,
  delta,
  icon,
  label,
  meta,
  value,
}: Readonly<{
  className?: string;
  delta?: Readonly<{ label: ReactNode; trend: StatTrend }>;
  icon?: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  value: ReactNode;
}>) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-small text-fg-muted">{label}</p>
          <p className="text-stat text-fg mt-2">{value}</p>
          {delta ? (
            <p
              className={cn(
                "text-small mt-1 inline-flex items-center gap-1 font-medium",
                delta.trend === "up" && "text-success",
                delta.trend === "down" && "text-danger",
                delta.trend === "neutral" && "text-fg-muted",
              )}
            >
              {delta.trend === "up" ? <TrendingUpIcon size="xs" /> : null}
              {delta.trend === "down" ? <TrendingDownIcon size="xs" /> : null}
              {delta.label}
            </p>
          ) : null}
          {meta ? (
            <div className="text-small text-fg-subtle mt-1">{meta}</div>
          ) : null}
        </div>
        {icon ? <IconTile className="max-md:hidden">{icon}</IconTile> : null}
      </CardContent>
    </Card>
  );
}

/** Responsive grid of `Stat` tiles: two columns on phones, auto-fit above. */
export function StatGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] md:gap-5",
        className,
      )}
      {...props}
    />
  );
}

/** @deprecated Use `Stat`. Kept for compatibility. */
export function StatCard({
  eyebrow,
  title,
  value,
  meta,
}: Readonly<{
  eyebrow: string;
  title: string;
  value: string;
  meta?: ReactNode;
}>) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="eyebrow">{eyebrow}</p>
        <div>
          <p className="text-small text-fg-muted">{title}</p>
          <p className="text-stat text-fg mt-2">{value}</p>
        </div>
        {meta ? <div className="text-small text-fg-muted">{meta}</div> : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Key-value list and list rows                                              */
/* ------------------------------------------------------------------------ */

export type KeyValueItem = Readonly<{
  /** Stable key; defaults to the label when it is a string. */
  id?: string;
  label: ReactNode;
  value: ReactNode;
}>;

/**
 * Description list (reference `.kv`): two columns on wider screens, stacked
 * label-over-value on phones.
 */
export function KeyValueList({
  className,
  items,
}: Readonly<{ className?: string; items: readonly KeyValueItem[] }>) {
  return (
    <dl
      className={cn(
        "text-label grid grid-cols-1 gap-0.5 font-normal md:grid-cols-[minmax(140px,200px)_1fr] md:gap-x-6 md:gap-y-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <Fragment
          key={item.id ?? (typeof item.label === "string" ? item.label : index)}
        >
          <dt className="text-fg-subtle">{item.label}</dt>
          <dd className="text-fg mb-2.5 min-w-0 font-medium break-words md:mb-0">
            {item.value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

/**
 * Row inside a card (reference `.list-row`): leading visual, title and
 * description, optional meta and trailing actions. Rows separate themselves;
 * use `as="li"` inside a `<ul>` when the rows form a list.
 */
export function ListRow({
  actions,
  as: Element = "div",
  children,
  className,
  description,
  leading,
  meta,
  title,
}: Readonly<{
  actions?: ReactNode;
  as?: "div" | "li";
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  title?: ReactNode;
}>) {
  return (
    <Element
      className={cn(
        "border-border flex flex-wrap items-center gap-4 border-b px-4 py-3.5 last:border-b-0 md:px-6 md:py-4",
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-[1_1_220px]">
        {title ? <div className="text-fg font-medium">{title}</div> : null}
        {description ? (
          <div className="text-small text-fg-muted mt-0.5">{description}</div>
        ) : null}
        {children}
      </div>
      {meta ? <div className="text-small text-fg-subtle">{meta}</div> : null}
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </Element>
  );
}
