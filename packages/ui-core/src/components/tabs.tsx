"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type TabItem<TValue extends string = string> = Readonly<{
  content: ReactNode;
  disabled?: boolean;
  label: ReactNode;
  value: TValue;
}>;

/**
 * Underline tabs (reference `.tabs`) on Radix Tabs: `tablist` / `tab` /
 * `tabpanel` roles and relationships, roving focus with Arrow/Home/End
 * (automatic activation), disabled tabs skipped, and a horizontally
 * scrolling list on narrow screens. Active colours swap per theme (brand in
 * light, neutral in dark) through `--color-tab-active-*`.
 *
 * Uncontrolled with `defaultValue`, or controlled with `value` +
 * `onValueChange` (for example to mirror `?tab=` in the URL).
 */
export function Tabs<TValue extends string>({
  ariaLabel,
  className,
  defaultValue,
  items,
  onValueChange,
  panelClassName,
  value,
}: Readonly<{
  ariaLabel: string;
  className?: string;
  defaultValue?: TValue;
  items: readonly TabItem<TValue>[];
  onValueChange?: (value: TValue) => void;
  panelClassName?: string;
  value?: TValue;
}>) {
  return (
    <TabsPrimitive.Root
      className={className}
      defaultValue={defaultValue}
      onValueChange={
        onValueChange ? (next) => onValueChange(next as TValue) : undefined
      }
      value={value}
    >
      <TabsPrimitive.List
        aria-label={ariaLabel}
        className="border-border flex [scrollbar-width:none] gap-1 overflow-x-auto border-b [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            className={cn(
              "min-h-control text-body text-fg-muted -mb-px shrink-0 border-b-2 border-transparent px-3 py-3 font-medium whitespace-nowrap transition-colors md:px-4",
              "hover:text-fg focus-visible:outline-focus focus-visible:outline-2 focus-visible:-outline-offset-2",
              "data-[state=active]:border-tab-active-border data-[state=active]:text-tab-active-fg",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
            disabled={item.disabled}
            key={item.value}
            value={item.value}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          className={cn(
            "focus-visible:outline-focus mt-6 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4",
            panelClassName,
          )}
          key={item.value}
          value={item.value}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
