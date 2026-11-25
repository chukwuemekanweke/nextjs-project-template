import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button, buttonClassName } from "./button";
import { IconButton } from "./icon-button";
import { CloseIcon, PlusIcon } from "./icons";

describe("Button", () => {
  it("is a native button that does not submit forms by default", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const screen = await render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <Button>Save</Button>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Save" });

    await expect.element(button).toHaveAttribute("type", "button");
    await button.click();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders each reference variant with its semantic token", async () => {
    const screen = await render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="dangerOutline">Danger outline</Button>
        <Button size="sm">Small</Button>
      </div>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Primary" }))
      .toHaveClass("bg-brand", "text-on-brand", "min-h-control");
    await expect
      .element(screen.getByRole("button", { name: "Secondary" }))
      .toHaveClass("bg-surface", "border-border-strong");
    await expect
      .element(screen.getByRole("button", { name: "Ghost" }))
      .toHaveClass("bg-transparent", "text-fg-muted");
    await expect
      .element(screen.getByRole("button", { name: "Danger", exact: true }))
      .toHaveClass("bg-danger-solid", "text-on-danger");
    await expect
      .element(screen.getByRole("button", { name: "Danger outline" }))
      .toHaveClass("text-danger", "border-border-strong");
    await expect
      .element(screen.getByRole("button", { name: "Small" }))
      .toHaveClass("min-h-control-sm");

    // 44px reference control height.
    const primary = screen.getByRole("button", { name: "Primary" }).element();
    expect(primary.getBoundingClientRect().height).toBe(44);
  });

  it("lets consumer classes override defaults", async () => {
    const screen = await render(<Button className="px-8">Wide</Button>);
    const button = screen.getByRole("button", { name: "Wide" });
    await expect.element(button).toHaveClass("px-8");
    await expect.element(button).not.toHaveClass("px-[18px]");
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Disabled" });

    await expect.element(button).toBeDisabled();
    await button.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("blocks repeated activation and submission while loading", async () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    const screen = await render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <Button loading onClick={onClick} type="submit">
          Pay now
        </Button>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Pay now" });

    await expect.element(button).toHaveAttribute("aria-busy", "true");
    await expect.element(button).toHaveAttribute("aria-disabled", "true");
    // Not natively disabled, so it stays focusable and keyboard users keep
    // their place.
    expect((button.element() as HTMLButtonElement).disabled).toBe(false);

    (button.element() as HTMLButtonElement).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await button.click({ force: true });

    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits once when not loading", async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    const screen = await render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <Button type="submit">Submit</Button>
      </form>,
    );
    await screen.getByRole("button", { name: "Submit" }).click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders leading and trailing icons without changing the name", async () => {
    const screen = await render(
      <Button leadingIcon={<PlusIcon />} trailingIcon={<CloseIcon />}>
        Add
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Add" });
    await expect.element(button).toBeVisible();
    expect(button.element().querySelectorAll("svg[aria-hidden]")).toHaveLength(
      2,
    );
  });

  it("composes a link with button styles and no nested button", async () => {
    const screen = await render(
      <Button asChild variant="secondary">
        <a href="/billing">Manage billing</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Manage billing" });

    await expect.element(link).toHaveAttribute("href", "/billing");
    await expect.element(link).toHaveClass("bg-surface");
    expect(link.element().querySelector("button")).toBeNull();
    expect(screen.container.querySelector("button")).toBeNull();
  });

  it("keeps buttonClassName as a compatibility API over buttonVariants", () => {
    expect(buttonClassName()).toContain("bg-brand");
    expect(buttonClassName({ variant: "destructive" })).toContain(
      "text-danger",
    );
    expect(buttonClassName({ variant: "danger" })).toContain("bg-danger-solid");
    expect(buttonClassName({ size: "sm" })).toContain("min-h-control-sm");
    expect(buttonClassName({ className: "w-full" })).toContain("w-full");
  });
});

describe("IconButton", () => {
  it("requires and exposes an accessible name", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <IconButton icon={<CloseIcon />} label="Close panel" onClick={onClick} />,
    );
    const button = screen.getByRole("button", { name: "Close panel" });

    await expect.element(button).toHaveAttribute("type", "button");
    await button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.element().getBoundingClientRect().width).toBe(44);
  });

  it("is reachable by keyboard and shows a focus outline", async () => {
    const screen = await render(
      <IconButton icon={<CloseIcon />} label="Close" />,
    );
    await userEvent.tab();
    const button = screen.getByRole("button", { name: "Close" });
    await expect.element(button).toHaveFocus();
    expect(getComputedStyle(button.element()).outlineStyle).toBe("solid");
  });
});
