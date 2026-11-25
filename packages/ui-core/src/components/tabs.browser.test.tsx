import { useState } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Tabs, type TabItem } from "./tabs";

type Tab = "overview" | "sessions" | "passkeys" | "activity";

const items: readonly TabItem<Tab>[] = [
  { content: <p>Overview panel</p>, label: "Overview", value: "overview" },
  { content: <p>Sessions panel</p>, label: "Sessions", value: "sessions" },
  {
    content: <p>Passkeys panel</p>,
    disabled: true,
    label: "Passkeys",
    value: "passkeys",
  },
  { content: <p>Activity panel</p>, label: "Activity", value: "activity" },
];

describe("Tabs", () => {
  it("renders the active tab and its labelled panel", async () => {
    const screen = await render(
      <Tabs
        ariaLabel="Security sections"
        defaultValue="sessions"
        items={items}
      />,
    );
    const list = screen.getByRole("tablist", { name: "Security sections" });
    const active = screen.getByRole("tab", { name: "Sessions" });
    const panel = screen.getByRole("tabpanel", { name: "Sessions" });

    await expect.element(list).toBeVisible();
    await expect.element(active).toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("tab", { name: "Overview" }))
      .toHaveAttribute("aria-selected", "false");
    await expect.element(panel).toHaveTextContent("Sessions panel");
    expect(active.element().getAttribute("aria-controls")).toBe(
      panel.element().id,
    );
  });

  it("moves with arrow keys, Home and End, skipping disabled tabs", async () => {
    const screen = await render(
      <Tabs
        ariaLabel="Security sections"
        defaultValue="overview"
        items={items}
      />,
    );

    await userEvent.tab();
    await expect
      .element(screen.getByRole("tab", { name: "Overview" }))
      .toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(screen.getByRole("tab", { name: "Sessions" }))
      .toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(screen.getByRole("tab", { name: "Activity" }))
      .toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    await expect
      .element(screen.getByRole("tab", { name: "Overview" }))
      .toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect
      .element(screen.getByRole("tabpanel"))
      .toHaveTextContent("Activity panel");
  });

  it("does not activate a disabled tab", async () => {
    const screen = await render(
      <Tabs
        ariaLabel="Security sections"
        defaultValue="overview"
        items={items}
      />,
    );
    const disabled = screen.getByRole("tab", { name: "Passkeys" });

    await expect.element(disabled).toBeDisabled();
    await disabled.click({ force: true });
    await expect.element(disabled).toHaveAttribute("aria-selected", "false");
  });

  it("supports controlled usage", async () => {
    function Controlled() {
      const [value, setValue] = useState<Tab>("overview");
      return (
        <>
          <Tabs
            ariaLabel="Security sections"
            items={items}
            onValueChange={setValue}
            value={value}
          />
          <output data-testid="value">{value}</output>
        </>
      );
    }
    const screen = await render(<Controlled />);
    await screen.getByRole("tab", { name: "Activity" }).click();
    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("activity");
  });

  it("shows a visible focus indicator on the focused tab", async () => {
    const screen = await render(
      <Tabs
        ariaLabel="Security sections"
        defaultValue="overview"
        items={items}
      />,
    );
    await userEvent.tab();
    const tab = screen.getByRole("tab", { name: "Overview" }).element();
    expect(getComputedStyle(tab).outlineStyle).toBe("solid");
  });
});
