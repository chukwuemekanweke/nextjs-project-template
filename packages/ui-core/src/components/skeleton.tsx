import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Card, CardContent } from "./card";

/*
 * Loading placeholders. `Skeleton` is a decorative block (hidden from
 * assistive technology) that callers size with classes; the composed
 * placeholders below add a polite status announcement. Pulsing stops under
 * `prefers-reduced-motion`.
 */

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-surface-3 rounded-md motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

/** Screen-reader-only status text for a loading region. */
export function LoadingStatus({
  label = "Loading",
}: Readonly<{ label?: string }>) {
  return (
    <span className="sr-only" role="status">
      {label}
    </span>
  );
}

/** Lines of text; the last line is shorter. */
export function SkeletonText({
  className,
  lines = 3,
}: Readonly<{ className?: string; lines?: number }>) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2.5", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          className={cn(
            "h-3.5",
            index === lines - 1 && lines > 1 ? "w-3/5" : "w-full",
          )}
          key={index}
        />
      ))}
    </div>
  );
}

/** Card-shaped placeholder: avatar, heading and text lines. */
export function SkeletonCard({
  className,
  label,
  lines = 3,
}: Readonly<{ className?: string; label?: string; lines?: number }>) {
  return (
    <Card aria-busy="true" className={className}>
      <LoadingStatus label={label} />
      <CardContent className="flex flex-col gap-4">
        <div aria-hidden="true" className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <SkeletonText lines={lines} />
      </CardContent>
    </Card>
  );
}

/** List-row placeholders matching `ListRow` spacing. */
export function SkeletonList({
  className,
  label,
  rows = 3,
}: Readonly<{ className?: string; label?: string; rows?: number }>) {
  return (
    <div aria-busy="true" className={className}>
      <LoadingStatus label={label} />
      <div aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div
            className="border-border flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0 md:px-6 md:py-4"
            key={index}
          >
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20 max-sm:hidden" />
          </div>
        ))}
      </div>
    </div>
  );
}
