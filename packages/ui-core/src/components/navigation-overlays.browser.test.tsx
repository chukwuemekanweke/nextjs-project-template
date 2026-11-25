import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "./button";
import { Drawer, DrawerClose } from "./drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { IconButton } from "./icon-button";
import { CloseIcon } from "./icons";
import { Tooltip } from "./tooltip";

function DrawerHarness({
  onOpenChange,
  side,
}: {
  onOpenChange?: (open: boolean) => void;
  side?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open menu</Button>
      <Drawer
        className="w-nav-drawer p-4"
        onOpenChange={(next) => {
          onOpenChange?.(next);
          setOpen(next);
        }}
        open={open}
        side={side}
        title="Menu"
      >
        <DrawerClose asChild>
          <IconButton icon={<CloseIcon />} label="Close menu" />
        </DrawerClose>
        <a href="#one">One</a>
        <a href="#two">Two</a>
      </Drawer>
    </>
  );
}

describe("Drawer", () => {
  it("opens as a named modal panel on the chosen side", async () => {
    const screen = await render(<DrawerHarness />);
    await screen.getByRole("button", { name: "Open menu" }).click();

    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect.element(drawer).toBeVisible();
    const rect = drawer.element().getBoundingClientRect();
    expect(rect.left).toBe(0);
    expect(rect.width).toBe(304);
    expect(rect.height).toBe(window.innerHeight);
  });

  it("opens from the right when asked", async () => {
    const screen = await render(<DrawerHarness side="right" />);
    await screen.getByRole("button", { name: "Open menu" }).click();
    const rect = page.getByRole("dialog").element().getBoundingClientRect();
    expect(Math.round(rect.right)).toBe(window.innerWidth);
  });

  it("traps focus, locks scroll, and returns focus after Escape", async () => {
    const screen = await render(<DrawerHarness />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await trigger.click();
    const drawer = page.getByRole("dialog").element();

    for (let step = 0; step < 5; step += 1) {
      await userEvent.tab();
      expect(drawer.contains(document.activeElement)).toBe(true);
    }
    expect(getComputedStyle(document.body).overflow).toBe("hidden");

    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("closes from the close control and from the scrim", async () => {
    const onOpenChange = vi.fn();
    const screen = await render(<DrawerHarness onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open menu" });

    await trigger.click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();

    await trigger.click();
    await userEvent.click(document.body, { position: { x: 1200, y: 400 } });
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("does not animate under reduced motion", async () => {
    const screen = await render(<DrawerHarness />);
    await screen.getByRole("button", { name: "Open menu" }).click();
    expect(
      getComputedStyle(page.getByRole("dialog").element()).animationName,
    ).toBe("none");
  });
});

function MenuHarness({ onSelect }: { onSelect: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Ada Lovelace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="#profile">Profile</a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSelect}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("supports arrow keys, Enter selection and focus return", async () => {
    const onSelect = vi.fn();
    const screen = await render(<MenuHarness onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Account" });
    await expect.element(trigger).toHaveAttribute("aria-haspopup", "menu");
    trigger.element().focus();
    await userEvent.keyboard("{ArrowDown}");

    await expect.element(page.getByRole("menu")).toBeVisible();
    await expect
      .element(page.getByRole("menuitem", { name: "Profile" }))
      .toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(page.getByRole("menuitem", { name: "Sign out" }))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledOnce();
    await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("dismisses on an outside click", async () => {
    const screen = await render(<MenuHarness onSelect={() => undefined} />);
    await screen.getByRole("button", { name: "Account" }).click();
    await expect.element(page.getByRole("menu")).toBeVisible();
    // A modal menu makes the page inert to pointer input (Playwright refuses
    // to click it); dispatch the outside press Radix listens for instead.
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }),
    );
    await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
  });

  it("gives items a 44px touch target", async () => {
    const screen = await render(<MenuHarness onSelect={() => undefined} />);
    await screen.getByRole("button", { name: "Account" }).click();
    const item = page.getByRole("menuitem", { name: "Profile" }).element();
    expect(item.getBoundingClientRect().height).toBe(44);
  });
});

describe("Tooltip", () => {
  it("shows on keyboard focus and hides on Escape without renaming the trigger", async () => {
    await render(
      <Tooltip content="Billing" side="right">
        <a aria-label="Billing" href="#billing">
          B
        </a>
      </Tooltip>,
    );
    const link = page.getByRole("link", { name: "Billing" });
    link.element().focus();

    await expect
      .element(page.getByRole("tooltip"))
      .toHaveTextContent("Billing");
    await expect.element(link).toHaveAccessibleName("Billing");
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();
  });
});
