"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

/**
 * On/off switch (reference `.switch`) on Radix Switch: `role="switch"` with
 * `aria-checked`, Space/Enter toggle, and a hidden input when `name` is set
 * so it participates in native forms. Label it with `<label htmlFor>` or
 * `aria-label`. The 44×24 track sits in a 44px-tall hit area.
 */
export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "group relative inline-flex h-11 w-11 shrink-0 items-center",
        "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-switch-track h-6 w-11 rounded-full transition-colors",
          "group-data-[state=checked]:bg-brand",
          "group-focus-visible:outline-focus group-focus-visible:outline-2 group-focus-visible:outline-offset-2",
        )}
      />
      <SwitchPrimitive.Thumb className="bg-switch-thumb pointer-events-none absolute left-[3px] size-[18px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
}
