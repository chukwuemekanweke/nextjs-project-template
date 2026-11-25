"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type DrawerSide = "left" | "right";

export type DrawerProps = Readonly<{
  children: ReactNode;
  /** Classes for the panel (width, background, padding, layout). */
  className?: string;
  id?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  side?: DrawerSide;
  /**
   * Accessible name of the drawer. It is visually hidden: the drawer's own
   * content (a brand, a heading) provides the visible context.
   */
  title: string;
}>;

/**
 * Modal side panel (reference `.m-drawer`, `.drawer`) on Radix Dialog:
 * rendered in a portal above a scrim, focus trapped inside and returned to
 * the previously focused element on close, background inert and page scroll
 * locked. Escape and a click on the scrim close it. The entry slide is
 * skipped under `prefers-reduced-motion`.
 *
 * The panel is unstyled beyond its position, height and surface so callers
 * compose their own header, body and footer (see `DrawerClose`).
 */
export function Drawer({
  children,
  className,
  id,
  onOpenChange,
  open,
  side = "left",
  title,
}: DrawerProps) {
  // Radix returns focus only to a `Dialog.Trigger`; drawers are opened from
  // app state, so remember whatever had focus and restore it.
  const returnFocus = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-scrim z-overlay motion-safe:animate-overlay-in fixed inset-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "bg-surface z-drawer fixed inset-y-0 flex max-w-full flex-col overflow-y-auto shadow-lg focus:outline-none",
            side === "left"
              ? "motion-safe:animate-drawer-in-left left-0"
              : "motion-safe:animate-drawer-in-right right-0",
            className,
          )}
          id={id}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current?.isConnected) {
              returnFocus.current.focus();
            }
          }}
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Closes the enclosing `Drawer`. Use with `asChild` around an `IconButton`
 * or `Button` so the drawer keeps a visible, labelled close control.
 */
export const DrawerClose = DialogPrimitive.Close;
