"use client";

import { FormField, Select, cn } from "@template/ui-core";
import { useId, type ReactNode } from "react";
import {
  ADMIN_RANGE_PRESETS,
  adminRangePresetLabels,
  formatUtcRange,
  parseAdminRangePreset,
  type AdminRangePreset,
  type UtcDateRange,
} from "./utc-range";

/*
 * Filter patterns. Filters are controlled: the page owns the value (URL
 * search params or state) and passes an explicit callback. A filter without
 * a live data source is rendered disabled with its reason, never as a
 * control that appears to change figures.
 */

/** Row of filter controls (reference toolbar above tables and charts). */
export function AdminFilterBar({
  children,
  className,
  label,
}: Readonly<{ children: ReactNode; className?: string; label: string }>) {
  return (
    <div
      aria-label={label}
      className={cn("flex flex-wrap items-end gap-3", className)}
      role="group"
    >
      {children}
    </div>
  );
}

/**
 * Reporting-period select (reference "27 Oct – 25 Nov 2026 (UTC)" button).
 * Shows the resolved UTC range when known. Without `onChange`, or with
 * `disabled`, the control is inert and `disabledReason` explains why.
 */
export function AdminRangeFilter({
  disabled = false,
  disabledReason,
  label = "Reporting period",
  onChange,
  range,
  value,
}: Readonly<{
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
  onChange?: (preset: AdminRangePreset) => void;
  /** The UTC days the shown figures cover, when a source reports them. */
  range?: UtcDateRange;
  value: AdminRangePreset;
}>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const inert = disabled || !onChange;
  const hint =
    (inert && disabledReason) ||
    (range ? formatUtcRange(range) : "All dates are UTC.");

  return (
    <FormField
      className="min-w-[200px]"
      descriptionId={hint ? hintId : undefined}
      hint={hint}
      inputId={id}
      label={label}
    >
      <Select
        aria-describedby={hint ? hintId : undefined}
        disabled={inert}
        id={id}
        onChange={(event) => {
          const preset = parseAdminRangePreset(event.target.value);
          if (preset && preset !== value) onChange?.(preset);
        }}
        value={value}
      >
        {ADMIN_RANGE_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {adminRangePresetLabels[preset]} (UTC)
          </option>
        ))}
      </Select>
    </FormField>
  );
}
