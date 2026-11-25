import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  InboxIcon,
  LoadingStatus,
  Skeleton,
  cn,
} from "@template/ui-core";
import type { ReactNode } from "react";

/*
 * Chart foundations (TD-10). The charting engine (Recharts) is deferred to
 * the first analytics screen; these pieces fix the frame, legend, colours,
 * sizing and state handling every future chart shares. Charts draw with SVG
 * and read the series tokens directly, so dark mode needs no extra code:
 *   <path stroke={chartSeriesColor(1)} />
 */

export type ChartSeries = 1 | 2 | 3 | 4;

const seriesBackground: Record<ChartSeries, string> = {
  1: "bg-chart-1",
  2: "bg-chart-2",
  3: "bg-chart-3",
  4: "bg-chart-4",
};

/** CSS colour for an SVG `stroke` / `fill` of series `n` (theme-aware). */
export function chartSeriesColor(series: ChartSeries): string {
  return `var(--color-chart-${series})`;
}

/** Theme-aware colours for gridlines, axis labels and area fills. */
export const chartColors = {
  area: "var(--color-chart-area)",
  axis: "var(--color-chart-axis)",
  grid: "var(--color-grid)",
} as const;

export type ChartLegendItem = Readonly<{ label: string; series: ChartSeries }>;

/** Series legend (reference `.legend`): swatch plus text label. */
export function ChartLegend({
  className,
  items,
}: Readonly<{ className?: string; items: readonly ChartLegendItem[] }>) {
  return (
    <ul
      className={cn(
        "text-small text-fg-muted flex flex-wrap gap-x-4 gap-y-1.5",
        className,
      )}
    >
      {items.map((item) => (
        <li className="inline-flex items-center gap-1.5" key={item.label}>
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 rounded-[3px]",
              seriesBackground[item.series],
            )}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export type ChartState = "ready" | "loading" | "empty" | "error";

/**
 * Card that frames one chart: title, optional description and actions, a
 * legend, and a plot area of the reference height (180px phone, 240px from
 * `md`). `summary` is the chart's text alternative (required): it names the
 * figure for assistive technology; pair complex charts with a table.
 *
 * `state` switches the plot area between the chart, a loading placeholder,
 * an empty message and an error with optional retry — the app decides which.
 */
export function ChartFrame({
  actions,
  children,
  className,
  description,
  emptyMessage = "No data for this period.",
  errorMessage,
  legend,
  onRetry,
  state = "ready",
  summary,
  title,
}: Readonly<{
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  emptyMessage?: ReactNode;
  errorMessage?: ReactNode;
  legend?: readonly ChartLegendItem[];
  onRetry?: () => void;
  state?: ChartState;
  summary: string;
  title: ReactNode;
}>) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle as="h3">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {legend && state === "ready" ? <ChartLegend items={legend} /> : null}
        <figure
          aria-busy={state === "loading" || undefined}
          className="m-0 h-[180px] md:h-[240px]"
        >
          <figcaption className="sr-only">{summary}</figcaption>
          {state === "ready" ? (
            <div aria-hidden="true" className="size-full [&_svg]:size-full">
              {children}
            </div>
          ) : null}
          {state === "loading" ? (
            <>
              <LoadingStatus label="Loading chart" />
              <Skeleton className="size-full" />
            </>
          ) : null}
          {state === "empty" ? (
            <div className="text-small text-fg-muted flex size-full flex-col items-center justify-center gap-2 text-center">
              <InboxIcon className="text-fg-subtle" />
              {emptyMessage}
            </div>
          ) : null}
          {state === "error" ? (
            <ErrorState
              className="size-full justify-center py-0"
              description={errorMessage}
              onRetry={onRetry}
              title="Chart unavailable"
            />
          ) : null}
        </figure>
      </CardContent>
    </Card>
  );
}
