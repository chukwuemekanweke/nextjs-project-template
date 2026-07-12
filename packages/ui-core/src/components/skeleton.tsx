import type { HTMLAttributes } from "react";

/**
 * TailAdmin-inspired loading primitives adapted for this workspace.
 * Copyright (c) TailAdmin. Retained under the MIT License.
 */

export function Skeleton({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
