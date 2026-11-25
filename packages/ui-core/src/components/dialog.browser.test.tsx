import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "./button";
import { ConfirmDialog, Dialog, Modal } from "./dialog";
import { Input } from "./form";

function DialogHarness({
  dismissible = true,
  onOpenChange,
}: {
  dismissible?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Rename passkey</Button>
      <Dialog
        description="Choose a name you will recognise."
        dismissible={dismissible}
        footer={<Button onClick={() => setOpen(false)}>Save</Button>}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          setOpen(next);
        }}
        open={open}
        title="Rename passkey"
      >
        <Input aria-label="Passkey name" />
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("opens as a labelled, described modal dialog", async () => {
    const screen = await render(<DialogHarness />);
    await screen.getByRole("button", { name: "Rename passkey" }).click();

    const dialog = page.getByRole("dialog", { name: "Rename passkey" });
    await expect.element(dialog).toBeVisible();
    await expect
      .element(dialog)
      .toHaveAccessibleDescription("Choose a name you will recognise.");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const onOpenChange = vi.fn();
    const screen = await render(<DialogHarness onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Rename passkey" });
    await trigger.click();
    await expect.element(page.getByRole("dialog")).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await expect.element(trigger).toHaveFocus();
  });

  it("closes from the labelled close button", async () => {
    const screen = await render(<DialogHarness />);
    await screen.getByRole("button", { name: "Rename passkey" }).click();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps focus inside the dialog", async () => {
    const screen = await render(<DialogHarness />);
    await screen.getByRole("button", { name: "Rename passkey" }).click();
    const dialog = page.getByRole("dialog").element();

    for (let step = 0; step < 6; step += 1) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("keeps the background inert and ignores clicks on the scrim", async () => {
    const onOpenChange = vi.fn();
    const screen = await render(<DialogHarness onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Rename passkey" });
    const triggerElement = trigger.element();
    await trigger.click();

    // Radix hides everything outside the dialog from assistive technology.
    await expect
      .poll(() => triggerElement.closest("[aria-hidden='true']"))
      .not.toBeNull();
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await expect.element(page.getByRole("dialog")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
    // Page scroll is locked while open.
    expect(getComputedStyle(document.body).overflow).toBe("hidden");
  });

  it("cannot be dismissed when not dismissible", async () => {
    const screen = await render(<DialogHarness dismissible={false} />);
    await screen.getByRole("button", { name: "Rename passkey" }).click();

    await expect
      .element(page.getByRole("button", { name: "Close dialog" }))
      .not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).toBeVisible();
  });

  it("is a bottom sheet on phones", async () => {
    await page.viewport(390, 844);
    try {
      const screen = await render(<DialogHarness />);
      await screen.getByRole("button", { name: "Rename passkey" }).click();
      const rect = page.getByRole("dialog").element().getBoundingClientRect();
      expect(Math.round(window.innerHeight - rect.bottom)).toBe(16);
      expect(Math.round(rect.width)).toBe(390 - 32);
    } finally {
      await page.viewport(1440, 900);
    }
  });

  it("scrolls long content inside the body", async () => {
    await render(
      <Dialog onOpenChange={() => undefined} open title="Terms">
        <div style={{ height: 3000 }}>Long content</div>
      </Dialog>,
    );
    const dialog = page.getByRole("dialog").element();
    expect(dialog.getBoundingClientRect().height).toBeLessThan(900);
    const body = dialog.querySelector(".overflow-y-auto") as HTMLElement;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
  });
});

describe("ConfirmDialog", () => {
  it("confirms, cancels and blocks dismissal while pending", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const screen = await render(
      <ConfirmDialog
        confirmLabel="Remove passkey"
        description="You will no longer be able to sign in with it."
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Remove passkey?"
      />,
    );

    await page.getByRole("button", { name: "Remove passkey" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);

    await screen.rerender(
      <ConfirmDialog
        confirmLabel="Remove passkey"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        pending
        title="Remove passkey?"
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    await expect
      .element(page.getByRole("button", { name: "Remove passkey" }))
      .toHaveAttribute("aria-busy", "true");
    await expect
      .element(page.getByRole("button", { name: "Cancel" }))
      .toBeDisabled();
  });
});

describe("Modal (compatibility adapter)", () => {
  it("keeps the original props on the accessible dialog", async () => {
    const onClose = vi.fn();
    await render(
      <Modal
        description="Sessions on other devices will end."
        footer={<Button>Sign out others</Button>}
        onClose={onClose}
        open
        size="compact"
        title="Sign out other sessions?"
      >
        <p>Body</p>
      </Modal>,
    );

    await expect
      .element(page.getByRole("dialog", { name: "Sign out other sessions?" }))
      .toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is not dismissible without onClose (for example while pending)", async () => {
    await render(
      <Modal open title="Saving">
        <p>Body</p>
      </Modal>,
    );
    await expect
      .element(page.getByRole("button", { name: "Close dialog" }))
      .not.toBeInTheDocument();
  });

  it("renders nothing when closed", async () => {
    await render(
      <Modal open={false} title="Hidden">
        <p>Body</p>
      </Modal>,
    );
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });
});
