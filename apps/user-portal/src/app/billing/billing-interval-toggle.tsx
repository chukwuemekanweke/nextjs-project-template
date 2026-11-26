"use client";

import { billingIntervalName } from "@/lib/billing-display";

/**
 * Segmented choice between backend-offered billing intervals (reference
 * `.seg`). Native radios keep keyboard and screen-reader behavior and take
 * part in forms; it renders nothing for one option. No savings label is
 * computed.
 */
export function BillingIntervalToggle({
  disabled = false,
  intervals,
  label = "Billing interval",
  name,
  onChange,
  value,
}: Readonly<{
  disabled?: boolean;
  intervals: ReadonlyArray<string>;
  label?: string;
  name: string;
  onChange: (billingInterval: string) => void;
  value: string;
}>) {
  if (intervals.length < 2) return null;
  return (
    <fieldset className="border-border bg-surface-3 inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-lg border p-1">
      <legend className="sr-only">{label}</legend>
      {intervals.map((interval) => (
        <label
          className="min-h-control-sm text-body text-fg-muted hover:text-fg has-checked:bg-surface-selected has-checked:text-fg has-focus-visible:outline-focus relative inline-flex shrink-0 cursor-pointer items-center rounded-sm px-4 font-medium whitespace-nowrap transition-colors has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-disabled:cursor-not-allowed has-disabled:opacity-50"
          key={interval}
        >
          <input
            checked={value === interval}
            className="sr-only"
            disabled={disabled}
            name={name}
            onChange={() => onChange(interval)}
            type="radio"
            value={interval}
          />
          {billingIntervalName(interval)}
        </label>
      ))}
    </fieldset>
  );
}
