"use client";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

/**
 * Action menu on Radix DropdownMenu: `role="menu"` with arrow-key and
 * typeahead navigation, Escape and outside-click dismissal, focus returned
 * to the trigger, and collision-aware placement in a portal above the page.
 *
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild><Button>Options</Button></DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 *
 * An `asChild` item's child must accept and spread the props it is given
 * (role, handlers, ref) onto its element.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  align = "end",
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        className={cn(
          "border-border bg-surface z-popover motion-safe:animate-overlay-in flex max-h-(--radix-dropdown-menu-content-available-height) min-w-56 flex-col overflow-y-auto rounded-lg border p-1.5 shadow-lg",
          className,
        )}
        collisionPadding={8}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "min-h-control text-label text-fg data-highlighted:bg-hover flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-left font-medium outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:size-icon-sm [&_svg]:text-fg-muted [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-3 py-2", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("bg-border -mx-1.5 my-1.5 h-px", className)}
      {...props}
    />
  );
}
