"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { CloseIcon } from "./icons";

export type DialogSize = "compact" | "default";

export type DialogProps = Readonly<{
  children?: ReactNode;
  className?: string;
  /** Accessible name of the close button. */
  closeLabel?: string;
  description?: ReactNode;
  /**
   * When false the dialog has no close button and ignores Escape — use while
   * an operation is pending or when the user must choose an action.
   */
  dismissible?: boolean;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  size?: DialogSize;
  title: ReactNode;
}>;

/**
 * Modal dialog (reference `.overlay` + `.modal`) on Radix Dialog: rendered in
 * a portal above a scrim, labelled by its title and description, focus
 * trapped inside and returned to the previously focused element on close,
 * background inert and page scroll locked. Escape closes it when
 * `dismissible`; clicking the scrim never does, so typed input and pending
 * confirmations are not lost by a stray click.
 *
 * Desktop: centred card near the top (max 520px). Phones (< md): a bottom
 * sheet. Long content scrolls inside the body; header and footer stay put.
 */
export function Dialog({
  children,
  className,
  closeLabel = "Close dialog",
  description,
  dismissible = true,
  footer,
  onOpenChange,
  open,
  size = "default",
  title,
}: DialogProps) {
  // Radix returns focus only to a `Dialog.Trigger`; our dialogs are opened
  // from app state, so remember whatever had focus and restore it.
  const returnFocus = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root
      onOpenChange={(next) => {
        if (!next && !dismissible) return;
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-scrim z-overlay motion-safe:animate-overlay-in fixed inset-0 flex items-end justify-center overflow-y-auto p-4 md:items-start md:px-4 md:pt-24 md:pb-8">
          <DialogPrimitive.Content
            className={cn(
              "border-border bg-surface flex max-h-full w-full flex-col rounded-[20px] border shadow-lg md:max-h-[calc(100dvh-8rem)] md:rounded-2xl",
              "max-md:motion-safe:animate-sheet-in md:motion-safe:animate-dialog-in focus:outline-none",
              size === "compact" ? "max-w-[440px]" : "max-w-dialog",
              className,
            )}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocus.current?.isConnected) {
                returnFocus.current.focus();
              }
            }}
            onEscapeKeyDown={(event) => {
              if (!dismissible) event.preventDefault();
            }}
            onInteractOutside={(event) => event.preventDefault()}
            onOpenAutoFocus={() => {
              returnFocus.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
            }}
            // No description: drop the reference Radix would otherwise add.
            {...(description ? {} : { "aria-describedby": undefined })}
          >
            <div className="border-border flex items-start justify-between gap-4 border-b px-4 py-3.5 md:px-6 md:py-[18px]">
              <div className="min-w-0 self-center">
                <DialogPrimitive.Title className="text-h3 text-fg">
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="text-small text-fg-muted mt-1">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
              {dismissible ? (
                <DialogPrimitive.Close asChild>
                  <IconButton
                    className="-my-1 -mr-1"
                    icon={<CloseIcon />}
                    label={closeLabel}
                    variant="ghost"
                  />
                </DialogPrimitive.Close>
              ) : null}
            </div>
            {children ? (
              <div className="p-card min-h-0 flex-1 overflow-y-auto">
                {children}
              </div>
            ) : null}
            {footer ? (
              <div className="border-border flex flex-wrap items-center justify-end gap-3 border-t px-4 py-3.5 max-md:*:flex-auto md:px-6 md:py-4">
                {footer}
              </div>
            ) : null}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Confirmation dialog for consequential actions (cancel a subscription,
 * remove a passkey, sign out other sessions). While `pending`, both actions
 * are inert and the dialog cannot be dismissed; the confirm button shows a
 * spinner. `onConfirm` is the app's mutation — this component never closes
 * itself on confirm.
 */
export function ConfirmDialog({
  cancelLabel = "Cancel",
  children,
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  open,
  pending = false,
  title,
  tone = "danger",
}: Readonly<{
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel: string;
  description?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  pending?: boolean;
  title: ReactNode;
  tone?: "danger" | "primary";
}>) {
  return (
    <Dialog
      description={description}
      dismissible={!pending}
      footer={
        <>
          <Button disabled={pending} onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            loading={pending}
            onClick={onConfirm}
            variant={tone === "danger" ? "danger" : "primary"}
          >
            {confirmLabel}
          </Button>
        </>
      }
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      open={open}
      size="compact"
      title={title}
    >
      {children}
    </Dialog>
  );
}

/**
 * @deprecated Use `Dialog` or `ConfirmDialog`. The original `Modal` props on
 * the accessible `Dialog`: `onClose` runs from the close button and Escape;
 * without `onClose` (for example while a request is pending) the dialog
 * cannot be dismissed.
 */
export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "default",
}: Readonly<{
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  size?: DialogSize;
}>) {
  return (
    <Dialog
      description={description}
      dismissible={Boolean(onClose)}
      footer={footer}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      open={open}
      size={size}
      title={title}
    >
      {children}
    </Dialog>
  );
}
