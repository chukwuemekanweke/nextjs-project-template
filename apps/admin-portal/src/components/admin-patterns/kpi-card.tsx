import {
  Card,
  CardContent,
  CircleAlertIcon,
  IconTile,
  LoadingStatus,
  Skeleton,
  TrendingDownIcon,
  TrendingUpIcon,
  cn,
} from "@template/ui-core";
import type { ReactNode } from "react";
import type { AdminMetric } from "./admin-metric";

/**
 * Admin KPI tile (reference `.stat`): label, formatted value, optional delta
 * and context. Loading announces itself; unavailable and error say so in
 * text and never show a value. `unavailableLabel` replaces the value slot.
 */
export function AdminKpiCard({
  icon,
  label,
  metric,
  unavailableLabel = "Not available",
}: Readonly<{
  icon?: ReactNode;
  label: string;
  metric: AdminMetric;
  unavailableLabel?: string;
}>) {
  return (
    <Card
      aria-busy={metric.state === "loading" || undefined}
      data-kpi={label}
      data-state={metric.state}
    >
      <CardContent className="flex h-full flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-small text-fg-muted min-w-0 font-normal break-words">
            {label}
          </h2>
          {icon ? (
            <IconTile className="max-md:hidden" size="sm">
              {icon}
            </IconTile>
          ) : null}
        </div>
        <KpiBody
          label={label}
          metric={metric}
          unavailableLabel={unavailableLabel}
        />
      </CardContent>
    </Card>
  );
}

function KpiBody({
  label,
  metric,
  unavailableLabel,
}: Readonly<{ label: string; metric: AdminMetric; unavailableLabel: string }>) {
  switch (metric.state) {
    case "loading":
      return (
        <>
          <LoadingStatus label={`Loading ${label.toLowerCase()}`} />
          <Skeleton className="mt-1 h-8 w-24" />
          <Skeleton className="mt-1 h-4 w-32 max-w-full" />
        </>
      );
    case "unavailable":
      return (
        <>
          <p className="text-h2 text-fg-muted">{unavailableLabel}</p>
          <p className="text-small text-fg-subtle">{metric.reason}</p>
        </>
      );
    case "error":
      return (
        <>
          <p className="text-h2 text-fg-muted">Couldn&apos;t load</p>
          <p className="text-small text-danger flex items-start gap-1.5">
            <CircleAlertIcon className="mt-0.5" size="xs" />
            <span>{metric.message}</span>
          </p>
        </>
      );
    case "ready":
      return (
        <>
          <p className="text-stat text-fg break-words">{metric.value}</p>
          {metric.delta || metric.context ? (
            <p className="text-small flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {metric.delta ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-medium",
                    metric.delta.trend === "up" && "text-success",
                    metric.delta.trend === "down" && "text-danger",
                    metric.delta.trend === "neutral" && "text-fg-muted",
                  )}
                >
                  {metric.delta.trend === "up" ? (
                    <TrendingUpIcon size="xs" />
                  ) : null}
                  {metric.delta.trend === "down" ? (
                    <TrendingDownIcon size="xs" />
                  ) : null}
                  {metric.delta.label}
                </span>
              ) : null}
              {metric.context ? (
                <span className="text-fg-subtle">{metric.context}</span>
              ) : null}
            </p>
          ) : null}
        </>
      );
  }
}

/** Four tiles on wide screens (reference `.grid.g4`), two on phones. */
export function AdminKpiGrid({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:gap-5 xl:grid-cols-4">
      {children}
    </div>
  );
}
