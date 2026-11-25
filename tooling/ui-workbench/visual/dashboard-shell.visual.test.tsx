import { composeStories } from "@storybook/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { applyTheme, type WorkbenchTheme } from "../.storybook/preview";
import * as shell from "../src/stories/dashboard-shell.stories";

/*
 * Selective dashboard-shell snapshots (FE-UI-004). Comprehensive visual QA —
 * phone and tablet widths, open drawers, long content — is FE-UI-016.
 * Phone captures are currently non-deterministic in the runner iframe (the
 * captured height alternates between 844px and 900px while the layout
 * measures 844px); interaction and responsive behaviour at those widths is
 * covered by dashboard-ui browser tests instead.
 */

const { AdminCollapsed, AdminPortal, UserCollapsed, UserPortal } =
  composeStories(shell);

const widths = { desktop: 1440 } as const;

type Width = keyof typeof widths;

async function show(Story: ComponentType, width: Width, theme: WorkbenchTheme) {
  const height = 900;
  await page.viewport(widths[width], height);
  // The resize applies asynchronously, and dynamic viewport units can lag
  // behind innerHeight; the shell sizes itself with dvh, so wait for both.
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;height:100dvh;width:100dvw";
  document.body.append(probe);
  await expect
    .poll(() => [probe.offsetWidth, probe.offsetHeight])
    .toEqual([widths[width], height]);
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

async function expectPage(name: string) {
  // The artboards are fixed width, not fixed height: grow to fit the page so
  // the whole layout is painted, as the component galleries do.
  const height = document.documentElement.scrollHeight;
  if (height > window.innerHeight)
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
