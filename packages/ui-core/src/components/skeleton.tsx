import type { HTMLAttributes } from "react";

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
