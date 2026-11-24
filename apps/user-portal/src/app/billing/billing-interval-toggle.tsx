"use client";

import { billingIntervalName } from "@/lib/billing-display";

/**
 * Segmented choice between backend-offered billing intervals. Native radios
 * keep keyboard and screen-reader behavior; it renders nothing for one option.
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
    <fieldset className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.03]">
      <legend className="sr-only">{label}</legend>
      {intervals.map((interval) => (
        <label
          className="has-checked:bg-brand-500 has-focus-visible:ring-brand-500/40 has-checked:shadow-theme-xs relative cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition has-checked:text-white has-focus-visible:ring-3 has-disabled:cursor-not-allowed dark:text-gray-300"
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
