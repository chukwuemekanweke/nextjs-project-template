"use client";

import { SegmentedControl } from "@template/ui-core";
import { useState } from "react";
import type { PricePlan } from "../types";
import { PlanGrid } from "./plan-card";

export type PricingInterval = Readonly<{
  /** Billing interval value, for example `Monthly`. */
  value: string;
  label: string;
  plans: readonly PricePlan[];
}>;

/**
 * Plans per billing interval behind a segmented switch (reference
 * `.seg` "Billing interval"). Each interval's cards are prepared by the
 * caller (on the server); switching only changes which list is shown.
 * With a single interval it renders the plan grid alone.
 */
export function PricingIntervals({
  defaultValue,
  intervals,
  label = "Billing interval",
}: Readonly<{
  defaultValue?: string;
  intervals: readonly PricingInterval[];
  label?: string;
}>) {
  const [value, setValue] = useState(defaultValue ?? intervals[0]?.value);
  const selected =
    intervals.find((interval) => interval.value === value) ?? intervals[0];

  if (!selected) return null;
  if (intervals.length < 2) return <PlanGrid plans={selected.plans} />;

  return (
    <div className="flex flex-col items-center gap-8">
      <SegmentedControl
        aria-label={label}
        onValueChange={setValue}
        options={intervals.map(({ label: optionLabel, value: option }) => ({
          label: optionLabel,
          value: option,
        }))}
        value={selected.value}
      />
      <PlanGrid className="w-full" plans={selected.plans} />
    </div>
  );
}
