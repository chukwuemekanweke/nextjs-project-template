import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingStatus,
  Skeleton,
  cn,
  type BadgeTone,
} from "@template/ui-core";
import type { ReactNode } from "react";

/*
 * Operational summary card (reference KYC queue, subscriptions needing
 * attention, payment providers): a titled list of label/value rows. Values
 * are display strings from a real source; a missing source is
 * `unavailable`, never a row of zeros or sample statuses.
 */

export type AdminSummaryRow = Readonly<{
  id: string;
  label: string;
  value: string;
  /** "badge" renders the value as a status badge in `tone`. */
  display?: "value" | "badge";
  tone?: BadgeTone;
}>;

export type AdminSummaryData =
  | Readonly<{ state: "ready"; rows: readonly AdminSummaryRow[] }>
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "empty"; message: string }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "error"; message: string }>;

export function AdminSummaryCard({
  action,
  data,
  onRetry,
  title,
}: Readonly<{
  /** Footer action, only for an implemented route (for example a Link). */
  action?: ReactNode;
  data: AdminSummaryData;
  onRetry?: () => void;
  title: string;
}>) {
  return (
    <Card
      aria-busy={data.state === "loading" || undefined}
      className="flex flex-col"
      data-state={data.state}
      data-summary={title}
    >
      <CardHeader>
        <CardTitle as="h3">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <SummaryBody data={data} onRetry={onRetry} title={title} />
        {action && data.state === "ready" ? (
          <div className="mt-auto pt-1">{action}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryBody({
  data,
  onRetry,
  title,
}: Readonly<{
  data: AdminSummaryData;
  onRetry?: () => void;
  title: string;
}>) {
  switch (data.state) {
    case "loading":
      return (
        <>
          <LoadingStatus label={`Loading ${title.toLowerCase()}`} />
          {[0, 1, 2].map((row) => (
            <Skeleton className="h-5 w-full" key={row} />
          ))}
        </>
      );
    case "empty":
      return <p className="text-small text-fg-muted">{data.message}</p>;
    case "unavailable":
      return (
        <div>
          <p className="text-fg-muted font-medium">Not available</p>
          <p className="text-small text-fg-subtle mt-0.5">{data.reason}</p>
        </div>
      );
    case "error":
      return (
        <ErrorState
          className="px-0 py-2"
          description={data.message}
          onRetry={onRetry}
          title={`Couldn't load ${title.toLowerCase()}`}
        />
      );
    case "ready":
      return (
        <dl className="grid gap-3">
          {data.rows.map((row) => (
            <div
              className="flex items-center justify-between gap-3"
              key={row.id}
            >
              <dt className="text-fg min-w-0 break-words">{row.label}</dt>
              <dd
                className={cn(
                  "shrink-0",
                  row.display !== "badge" && "text-fg font-semibold",
                )}
              >
                {row.display === "badge" ? (
                  <Badge tone={row.tone ?? "neutral"}>{row.value}</Badge>
                ) : (
                  <span
                    className={
                      row.tone === "danger" ? "text-danger" : undefined
                    }
                  >
                    {row.value}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

/** Three summary cards on wide screens (reference `.grid.g3`). */
export function AdminSummaryGrid({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
      {children}
    </div>
  );
}
