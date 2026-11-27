"use client";

import { Button } from "@template/ui-core";
import { useId } from "react";

/**
 * Controlled drill-down: the page owns the selected category and loads the
 * matching records. The chart only reports the intent.
 */
export type AdminChartSelection = Readonly<{
  /** Accessible name of the period buttons, for example "Registration period". */
  label: string;
  /** The selected category label, or `null` for none. */
  selected: string | null;
  /** `null` clears the selection. Omit when records cannot be loaded. */
  onSelect?: (category: string | null) => void;
  /** Why selection is inert; shown when `onSelect` is missing. */
  disabledReason?: string;
}>;

/**
 * One toggle button per category (native buttons, so Tab/Enter/Space work).
 * Pressing the selected category again clears the selection.
 */
export function ChartPeriodPicker({
  categories,
  selectedIndex,
  selection,
}: Readonly<{
  categories: readonly string[];
  selectedIndex: number;
  selection: AdminChartSelection;
}>) {
  const id = useId();
  const statusId = `${id}-status`;
  const { onSelect } = selection;
  const selected = selectedIndex >= 0 ? categories[selectedIndex] : undefined;
  let status = "No period selected. Choose one to list its records.";
  if (!onSelect) {
    status = selection.disabledReason ?? "Period selection is not available.";
  } else if (selected) {
    status = `Selected: ${selected}. Press it again to clear.`;
  }

  return (
    <div className="mt-3 grid gap-2">
      <div
        aria-describedby={statusId}
        aria-label={selection.label}
        className="flex flex-wrap gap-2"
        role="group"
      >
        {categories.map((category, index) => {
          const pressed = index === selectedIndex;
          return (
            <Button
              aria-pressed={pressed}
              disabled={!onSelect}
              key={category}
              onClick={() => onSelect?.(pressed ? null : category)}
              size="sm"
              variant={pressed ? "primary" : "secondary"}
            >
              {category}
            </Button>
          );
        })}
      </div>
      <p aria-live="polite" className="text-small text-fg-muted" id={statusId}>
        {status}
      </p>
    </div>
  );
}
