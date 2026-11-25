"use client";

import { ToggleGroup } from "radix-ui";
import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type SegmentedOption<TValue extends string = string> = Readonly<{
  disabled?: boolean;
  label: ReactNode;
  value: TValue;
}>;

/**
 * Single-choice segmented control (reference `.seg`, for example Monthly /
 * Yearly) on Radix ToggleGroup: arrow keys move between options and one
 * option is always selected. Controlled (`value` + `onValueChange`) or
 * uncontrolled (`defaultValue`). Scrolls horizontally on narrow screens.
 */
export function SegmentedControl<TValue extends string>({
  "aria-label": ariaLabel,
  className,
  defaultValue,
  disabled,
  onValueChange,
  options,
  value: controlledValue,
}: Readonly<{
  "aria-label": string;
  className?: string;
  defaultValue?: TValue;
  disabled?: boolean;
  onValueChange?: (value: TValue) => void;
  options: readonly SegmentedOption<TValue>[];
  value?: TValue;
}>) {
  const [uncontrolledValue, setUncontrolledValue] = useState<
    TValue | undefined
  >(defaultValue ?? options[0]?.value);
  const value = controlledValue ?? uncontrolledValue;

  return (
    <ToggleGroup.Root
      aria-label={ariaLabel}
      className={cn(
        "border-border bg-surface-3 inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1",
        className,
      )}
      disabled={disabled}
      onValueChange={(next) => {
        // Radix allows deselecting; a segmented control always has a value.
        if (!next) return;
        setUncontrolledValue(next as TValue);
        onValueChange?.(next as TValue);
      }}
      type="single"
      value={value ?? ""}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          className={cn(
            "min-h-control-sm text-body text-fg-muted shrink-0 rounded-sm px-4 font-medium whitespace-nowrap transition-colors",
            "hover:text-fg focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-1",
            "data-[state=on]:bg-surface-selected data-[state=on]:text-fg data-[state=on]:shadow-sm",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          disabled={option.disabled}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
