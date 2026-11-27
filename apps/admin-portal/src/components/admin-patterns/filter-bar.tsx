"use client";

import { FormField, SearchInput, Select, cn } from "@template/ui-core";
import { useId, type ReactNode } from "react";
import { ADMIN_FILTERS_UNAVAILABLE } from "./admin-values";
import {
  ADMIN_RANGE_PRESETS,
  adminRangePresetLabels,
  formatUtcRange,
  parseAdminRangePreset,
  type AdminRangePreset,
  type AdminReportingRange,
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
 * `onSelectCustom` adds a "Custom range" option; the page then owns the
 * explicit UTC dates (see `isValidUtcDateRange`).
 */
export function AdminRangeFilter({
  disabled = false,
  disabledReason,
  label = "Reporting period",
  onChange,
  onSelectCustom,
  range,
  value,
}: Readonly<{
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
  onChange?: (preset: AdminRangePreset) => void;
  onSelectCustom?: () => void;
  /** The UTC days the shown figures cover, when a source reports them. */
  range?: UtcDateRange;
  value: AdminReportingRange;
}>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const inert = disabled || !onChange;
  const offersCustom = Boolean(onSelectCustom) || value === "custom";
  const hint =
    (inert && disabledReason) ||
    (range ? formatUtcRange(range) : "All dates are UTC.");

  function selectRange(next: string) {
    if (next === value) {
      return;
    }
    if (next === "custom") {
      onSelectCustom?.();
      return;
    }
    const preset = parseAdminRangePreset(next);
    if (preset) {
      onChange?.(preset);
    }
  }

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
        onChange={(event) => selectRange(event.target.value)}
        value={value}
      >
        {ADMIN_RANGE_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {adminRangePresetLabels[preset]} (UTC)
          </option>
        ))}
        {offersCustom ? (
          <option disabled={!onSelectCustom} value="custom">
            Custom range (UTC)
          </option>
        ) : null}
      </Select>
    </FormField>
  );
}

/**
 * Labelled search filter. Controlled; without `onChange` it is inert and
 * `disabledReason` is shown and linked with `aria-describedby`.
 */
export function AdminSearchFilter({
  disabledReason = ADMIN_FILTERS_UNAVAILABLE,
  label = "Search",
  onChange,
  placeholder,
  value,
}: Readonly<{
  disabledReason?: string;
  label?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  value: string;
}>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const inert = !onChange;
  return (
    <FormField
      className="min-w-[200px] flex-[2_1_240px]"
      descriptionId={inert ? hintId : undefined}
      hint={inert ? disabledReason : undefined}
      inputId={id}
      label={label}
    >
      <SearchInput
        aria-describedby={inert ? hintId : undefined}
        className="md:max-w-none"
        disabled={inert}
        id={id}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </FormField>
  );
}
