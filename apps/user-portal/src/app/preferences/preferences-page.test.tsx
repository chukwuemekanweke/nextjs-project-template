import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PreferencesPage, { metadata } from "./page";

// Without a ThemeProvider next-themes returns its default context, which is
// what the server renders before hydration: no choice is pre-selected.
const render = () => renderToStaticMarkup(createElement(PreferencesPage));

describe("Preferences page", () => {
  it("renders the page heading and title", () => {
    const markup = render();
    expect(metadata.title).toBe("Preferences");
    expect(markup.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(markup).toMatch(/<h1[^>]*>Preferences<\/h1>/);
  });

  it("uses the shared theme control with Light, Dark and System", () => {
    const markup = render();

    expect(markup).toMatch(/<legend[^>]*>Appearance<\/legend>/);
    const radios = markup.match(/<input[^>]*type="radio"[^>]*>/g) ?? [];
    expect(radios).toHaveLength(3);
    for (const value of ["light", "dark", "system"]) {
      expect(radios.some((radio) => radio.includes(`value="${value}"`))).toBe(
        true,
      );
    }
    // All three radios share one group, so arrow keys move between them.
    const names = new Set(
      radios.map((radio) => /name="([^"]+)"/.exec(radio)?.[1]),
    );
    expect(names.size).toBe(1);
    // Hydration-safe: nothing is checked before the stored theme is known.
    expect(radios.some((radio) => /\schecked/.test(radio))).toBe(false);
  });

  it("explains that the theme applies immediately and is not saved to the account", () => {
    const markup = render();
    expect(markup).toContain("Changes apply immediately");
    expect(markup).toContain("not saved to your account");
  });

  it("shows language as unavailable instead of a working preference", () => {
    const markup = render();
    const select = /<select[^>]*id="language"[^>]*>/.exec(markup)?.[0];

    expect(select).toBeDefined();
    expect(select).toContain("disabled");
    expect(select).toContain('aria-describedby="language-hint"');
    expect(markup).toContain("Choosing a language is not supported yet.");
    expect(markup).not.toContain("Français");
    expect(markup).not.toContain("Yorùbá");
  });

  it("keeps security alerts always on and cannot turn them off", () => {
    const markup = render();
    const securitySwitch = /<button[^>]*role="switch"[^>]*>/.exec(markup)?.[0];

    expect(securitySwitch).toContain(
      'aria-label="Security alerts (always on)"',
    );
    expect(securitySwitch).toContain('aria-checked="true"');
    expect(securitySwitch).toContain("disabled");
    // It is the only switch: unsupported notifications have no toggle.
    expect(markup.match(/role="switch"/g)).toHaveLength(1);
  });

  it("marks unsupported notification preferences as not available", () => {
    const markup = render();
    expect(markup).toContain("Proposed");
    expect(markup).toContain("Billing emails");
    expect(markup).toContain("Product updates");
    expect(markup.match(/>Not available</g)).toHaveLength(2);
  });

  it("has no save action or success message for unpersisted preferences", () => {
    const markup = render();
    expect(markup).not.toMatch(/Save preferences/i);
    expect(markup).not.toContain('type="submit"');
    expect(markup).not.toMatch(/saved successfully|preferences (were )?saved/i);
    expect(markup).not.toContain('role="status"');
  });
});
