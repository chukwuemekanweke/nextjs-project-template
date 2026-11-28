import { composeStories } from "@storybook/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { applyTheme, type WorkbenchTheme } from "../.storybook/preview";
import * as shell from "../src/stories/dashboard-shell.stories";

/*
 * Dashboard-shell snapshots: the desktop set (FE-UI-004) plus phone and
 * tablet shells and the open drawer (FE-UI-016; verification-strategy.md §3:
 * shells at phone/tablet/desktop × light/dark, overlays at phone × light and
 * the drawer's widest layout × dark). The phone-height flake of DR-085 no
 * longer reproduces now that the runner window is larger than every artboard
 * and `show` waits for the dvh probe: repeated FE-UI-016 captures at 390×844
 * and 834×1112 were identical in size every time.
 */

const { AdminCollapsed, AdminPortal, UserCollapsed, UserPortal } =
  composeStories(shell);

const viewports = {
  desktop: [1440, 900],
  phone: [390, 844],
  tablet: [834, 1112],
} as const;

type Width = keyof typeof viewports;

async function show(Story: ComponentType, width: Width, theme: WorkbenchTheme) {
  const [viewportWidth, height] = viewports[width];
  await page.viewport(viewportWidth, height);
  // The resize applies asynchronously, and dynamic viewport units can lag
  // behind innerHeight; the shell sizes itself with dvh, so wait for both.
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;height:100dvh;width:100dvw";
  document.body.append(probe);
  await expect
    .poll(() => [probe.offsetWidth, probe.offsetHeight])
    .toEqual([viewportWidth, height]);
  probe.remove();
  await render(<Story />);
  // After render: the story decorator applies the toolbar theme.
  applyTheme(theme);
  await Promise.all([
    document.fonts.load('500 15px "Outfit Variable"'),
    document.fonts.load('600 15px "Outfit Variable"'),
    document.fonts.load('700 18px "Outfit Variable"'),
  ]);
  await document.fonts.ready;
}

async function expectPage(name: string, { grow = true } = {}) {
  // The artboards are fixed width, not fixed height: grow to fit the page so
  // the whole layout is painted, as the component galleries do. Phone and
  // tablet shells keep the viewport: their content scrolls inside <main>,
  // and growing raced that layout (the 844/900px flake of DR-085).
  const height = document.documentElement.scrollHeight;
  if (grow && height > window.innerHeight)
    await page.viewport(window.innerWidth, height);
  // Capture the shell root rather than <body> (whose screenshot size is
  // unreliable inside the runner iframe). Element screenshots clip the
  // painted page, so the portalled drawer and menus are included.
  const root = document.querySelector("[data-dashboard-shell]") as HTMLElement;
  await expect(page.elementLocator(root)).toMatchScreenshot(name);
}

afterEach(() => applyTheme("light"));

const cases: ReadonlyArray<[string, ComponentType, WorkbenchTheme]> = [
  ["user", UserPortal, "light"],
  ["user", UserPortal, "dark"],
  ["admin", AdminPortal, "light"],
  ["admin", AdminPortal, "dark"],
  ["user-collapsed", UserCollapsed, "light"],
  ["admin-collapsed", AdminCollapsed, "dark"],
];

describe("dashboard shell (desktop)", () => {
  it.each(cases)("%s × %s", async (name, Story, theme) => {
    await show(Story, "desktop", theme);
    await expectPage(`shell-${name}-desktop-${theme}`);
  });

  it("account menu open × light", async () => {
    await show(UserPortal, "desktop", "light");
    await page.getByRole("button", { name: /Account menu/ }).click();
    await expect.element(page.getByRole("menu")).toBeVisible();
    await expectPage("shell-account-menu-desktop-light");
  });
});

const smallCases: ReadonlyArray<
  [string, Exclude<Width, "desktop">, WorkbenchTheme, ComponentType]
> = [
  ["user", "phone", "light", UserPortal],
  ["user", "phone", "dark", UserPortal],
  ["admin", "phone", "light", AdminPortal],
  ["admin", "phone", "dark", AdminPortal],
  ["user", "tablet", "light", UserPortal],
  ["user", "tablet", "dark", UserPortal],
  ["admin", "tablet", "light", AdminPortal],
  ["admin", "tablet", "dark", AdminPortal],
];

describe("dashboard shell (phone and tablet)", () => {
  it.each(smallCases)("%s × %s × %s", async (name, width, theme, Story) => {
    await show(Story, width, theme);
    await expectPage(`shell-${name}-${width}-${theme}`, { grow: false });
  });

  // Light only: the workbench theme toolbar sets the theme class without
  // next-themes, so the drawer's Dark mode switch would read "off" in a dark
  // capture. The dark drawer is checked in the User Portal instead.
  it("drawer open × phone × light", async () => {
    await show(UserPortal, "phone", "light");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expectPage("shell-drawer-open-phone-light", { grow: false });
  });
});
