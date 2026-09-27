import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SecurityTabs } from "./security-tabs";

describe("SecurityTabs", () => {
  it("renders General as the initial accessible tab", () => {
    const markup = renderToStaticMarkup(
      createElement(SecurityTabs, {
        devices: createElement("p", null, "Device settings"),
        general: createElement("p", null, "General settings"),
      }),
    );

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-label="Security sections"');
    expect(markup).toMatch(/General<\/button>/);
    expect(markup).toMatch(/aria-selected="true"[^>]*>General/);
    expect(markup).toMatch(/aria-selected="false"[^>]*>Devices/);
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain("General settings");
    expect(markup).not.toContain("Device settings");
  });
});
