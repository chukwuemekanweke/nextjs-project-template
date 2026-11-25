import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const themeState = vi.hoisted(() => ({
  resolvedTheme: "dark" as string | undefined,
  setTheme: vi.fn(),
  theme: "system" as string | undefined,
}));

vi.mock("next-themes", () => ({
  useTheme: () => themeState,
}));

import { ThemeSelect, ThemeSwitch } from "./theme-controls";
import {
  THEME_STORAGE_KEY,
  isThemePreference,
  themeProviderSettings,
} from "./theme-config";

// Server rendering is what hydration compares against: the stored preference
// is unknown there, so controls must not render state-dependent attributes.

describe("ThemeSwitch", () => {
  beforeEach(() => themeState.setTheme.mockClear());

  it("renders an accessible, state-neutral toggle on the server", () => {
    const html = renderToStaticMarkup(<ThemeSwitch />);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Dark theme"');
    expect(html).not.toContain("aria-pressed");
    // Icons follow the pre-paint `.dark` class instead of React state.
    expect(html).toContain("dark:hidden");
    expect(html).toContain("dark:block");
  });

  it("accepts layout classes", () => {
    expect(renderToStaticMarkup(<ThemeSwitch className="ml-2" />)).toContain(
      "ml-2",
    );
  });
});

describe("ThemeSelect", () => {
  it("renders a labelled Light / Dark / System radio group", () => {
    const html = renderToStaticMarkup(<ThemeSelect label="Appearance" />);
    expect(html).toMatch(/<fieldset[^>]*>.*<legend[^>]*>Appearance<\/legend>/);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    for (const value of ["light", "dark", "system"]) {
      expect(html).toContain(`value="${value}"`);
    }
    expect(html).toContain(">Light<");
    expect(html).toContain(">System<");
  });

  it("does not mark a choice as checked before hydration", () => {
    expect(renderToStaticMarkup(<ThemeSelect />)).not.toMatch(/\schecked=/);
  });

  it("shows a visible focus indicator on the selected segment", () => {
    expect(renderToStaticMarkup(<ThemeSelect />)).toContain(
      "has-focus-visible:outline-focus",
    );
  });
});

describe("theme provider settings", () => {
  it("keeps the existing localStorage key so stored preferences survive", () => {
    expect(THEME_STORAGE_KEY).toBe("theme");
    expect(themeProviderSettings.storageKey).toBe("theme");
  });

  it("follows the system preference by default via the html class", () => {
    expect(themeProviderSettings).toMatchObject({
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
      themes: ["light", "dark"],
    });
  });

  it("accepts only supported preferences", () => {
    expect(["light", "dark", "system"].every(isThemePreference)).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
  });
});
