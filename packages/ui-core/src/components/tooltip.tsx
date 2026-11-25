"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";

/**
 * Short supplementary label on hover and keyboard focus (Radix Tooltip),
 * rendered in a portal so scroll containers never clip it. Escape dismisses
 * it. A tooltip is not an accessible name: icon-only triggers still need
 * `aria-label` (or `IconButton`'s `label`).
 *
 * `children` must be a single element that forwards props and ref.
 */
export function Tooltip({
  children,
  content,
  side = "top",
}: Readonly<{
  children: ReactElement;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}>) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="bg-fg text-caption text-bg z-tooltip motion-safe:animate-overlay-in rounded-sm px-2.5 py-1.5 shadow-sm"
            collisionPadding={8}
            side={side}
            sideOffset={8}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
