import { afterEach, describe, expect, it } from "vitest";
import { userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { THEME_STORAGE_KEY } from "./theme-config";
import { DarkModeSwitch, ThemeSelect } from "./theme-controls";
import { ThemeProvider } from "./theme-provider";

// ThemeSelect is the Preferences page control (User Portal FE-UI-007): it
// must apply each choice immediately through the shared provider and its
// single storage key, and stay consistent with the drawer's DarkModeSwitch.

/** The native radios are visually hidden; users click their visible label. */
const choose = (group: Locator, label: string) =>
  group.getByText(label, { exact: true }).click();

const isDark = () => document.documentElement.classList.contains("dark");

function Controls() {
  return (
    <ThemeProvider>
      <ThemeSelect label="Appearance" />
      <DarkModeSwitch />
    </ThemeProvider>
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark", "light");
});

describe("ThemeSelect", () => {
  it("applies Light, Dark and System immediately and stores the choice", async () => {
    const screen = await render(<Controls />);
    const group = screen.getByRole("group", { name: "Appearance" });

    await choose(group, "Dark");
    await expect.poll(isDark).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    await expect
      .element(group.getByRole("radio", { name: "Dark" }))
      .toBeChecked();

    await choose(group, "Light");
    await expect.poll(isDark).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    await choose(group, "System");
    await expect
      .poll(() => localStorage.getItem(THEME_STORAGE_KEY))
      .toBe("system");
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    await expect.poll(isDark).toBe(prefersDark);
  });

  it("supports arrow-key selection between the native radios", async () => {
    const screen = await render(<Controls />);
    const group = screen.getByRole("group", { name: "Appearance" });

    await choose(group, "Light");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(group.getByRole("radio", { name: "Dark" }))
      .toBeChecked();
    await expect.poll(isDark).toBe(true);
  });

  it("stays consistent with the drawer's DarkModeSwitch", async () => {
    const screen = await render(<Controls />);
    const group = screen.getByRole("group", { name: "Appearance" });
    const darkSwitch = screen.getByRole("switch", { name: "Dark mode" });

    await choose(group, "Dark");
    await expect.element(darkSwitch).toHaveAttribute("aria-checked", "true");

    await darkSwitch.click();
    await expect.poll(isDark).toBe(false);
    await expect
      .element(group.getByRole("radio", { name: "Light" }))
      .toBeChecked();
  });
});
