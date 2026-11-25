import { composeStories } from "@storybook/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { applyTheme, type WorkbenchTheme } from "../.storybook/preview";
import * as actions from "../src/stories/actions.stories";
import * as charts from "../src/stories/charts.stories";
import * as data from "../src/stories/data.stories";
import * as feedback from "../src/stories/feedback.stories";
import * as forms from "../src/stories/forms.stories";
import * as indicators from "../src/stories/indicators.stories";
import * as overlays from "../src/stories/overlays.stories";
import * as surfaces from "../src/stories/surfaces.stories";

/*
 * Matrix (verification-strategy.md §3, extended for the primitives ticket):
 * every gallery at the two reference artboards (1440 desktop, 390 phone) in
 * both themes; overlays open at phone × light and desktop × dark.
 */

const viewports = {
  desktop: { height: 900, width: 1440 },
  phone: { height: 844, width: 390 },
} as const;

type Viewport = keyof typeof viewports;

const { AllVariants } = composeStories(actions);
const { AllIndicators } = composeStories(indicators);
const { AllSurfaces } = composeStories(surfaces);
const { ChoiceControls, TextControls } = composeStories(forms);
const { Alerts, EmptyAndError, LoadingPlaceholders } = composeStories(feedback);
const { Empty, LoadError, PagerStates, Rows } = composeStories(data);
const { ConfirmDestructive, DialogOpen, TabsGallery } =
  composeStories(overlays);
const { Ready } = composeStories(charts);

const galleries: ReadonlyArray<[string, ComponentType]> = [
  ["buttons", AllVariants],
  ["indicators", AllIndicators],
  ["surfaces", AllSurfaces],
  ["form-text-controls", TextControls],
  ["form-choice-controls", ChoiceControls],
  ["alerts", Alerts],
  ["loading-placeholders", LoadingPlaceholders],
  ["empty-and-error", EmptyAndError],
  ["data-table", Rows],
  ["data-table-empty", Empty],
  ["data-table-error", LoadError],
  ["pager", PagerStates],
  ["tabs", TabsGallery],
  ["chart-frame", Ready],
];

const combinations: ReadonlyArray<[Viewport, WorkbenchTheme]> = [
  ["desktop", "light"],
  ["desktop", "dark"],
  ["phone", "light"],
  ["phone", "dark"],
];

async function prepare(
  viewport: Viewport,
  theme: WorkbenchTheme,
  target?: Element,
) {
  const { height, width } = viewports[viewport];
  await page.viewport(width, height);
  applyTheme(theme);
  // Measure only after the real faces are in use (fallback metrics differ).
  await Promise.all([
    document.fonts.load('500 15px "Outfit Variable"'),
    document.fonts.load('600 15px "Outfit Variable"'),
    document.fonts.load('400 13px "JetBrains Mono Variable"'),
  ]);
  await document.fonts.ready;
  // Grow the artboard to fit tall galleries so the whole element is painted
  // (the reference artboards are fixed width, not fixed height).
  const contentHeight = target
    ? Math.ceil(target.getBoundingClientRect().bottom) + 32
    : 0;
  if (contentHeight > height) await page.viewport(width, contentHeight);
}

afterEach(() => applyTheme("light"));

describe.each(combinations)("%s × %s", (viewport, theme) => {
  it.each(galleries)("%s", async (name, Story) => {
    await render(<Story />);
    const element = document.querySelector("[data-gallery]") as HTMLElement;
    await prepare(viewport, theme, element);
    await expect(page.elementLocator(element)).toMatchScreenshot(
      `${name}-${viewport}-${theme}`,
    );
  });
});

describe("overlays", () => {
  const cases: ReadonlyArray<
    [string, ComponentType, Viewport, WorkbenchTheme]
  > = [
    ["dialog", DialogOpen, "phone", "light"],
    ["dialog", DialogOpen, "desktop", "dark"],
    ["confirm-dialog", ConfirmDestructive, "desktop", "light"],
    ["confirm-dialog", ConfirmDestructive, "phone", "dark"],
  ];

  it.each(cases)("%s %s × %s", async (name, Story, viewport, theme) => {
    await render(<Story />);
    await prepare(viewport, theme);
    await expect(page.getByRole("dialog")).toMatchScreenshot(
      `${name}-${viewport}-${theme}`,
    );
  });
});
