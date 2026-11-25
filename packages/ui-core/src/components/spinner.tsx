import { cn } from "../lib/cn";
import { LoaderIcon } from "./icons";

export type SpinnerSize = "sm" | "md" | "lg";

const spinnerSizes: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
};

/**
 * Indeterminate loading indicator.
 *
 * Standalone, it is a polite `role="status"` region whose `label` (default
 * "Loading") is announced to screen readers. Inside a control that already
 * communicates its busy state (a loading `Button`), pass `decorative`.
 * Rotation stops under `prefers-reduced-motion`.
 */
export function Spinner({
  className,
  decorative = false,
  label = "Loading",
  size = "md",
}: Readonly<{
  className?: string;
  decorative?: boolean;
  label?: string;
  size?: SpinnerSize;
}>) {
  const icon = (
    <LoaderIcon
      className={cn(
        "motion-safe:animate-spin",
        spinnerSizes[size],
        decorative && className,
      )}
    />
  );

  if (decorative) {
    return icon;
  }

  return (
    <span
      className={cn("text-fg-subtle inline-flex items-center", className)}
      role="status"
    >
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
