import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { CtaBanner } from "./cta-banner";
import { FaqGrid } from "./faq-grid";

/*
 * Accessibility regressions found by the FE-UI-016 axe pass over the
 * marketing pages: CTA lead contrast (WCAG 1.4.3) and FAQ description-list
 * structure (WCAG 1.3.1).
 */

function channel(value: number) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: string) {
  const [r = 0, g = 0, b = 0] = rgb.match(/[\d.]+/g)!.map(Number);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: string, background: string) {
  const [high, low] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (high! + 0.05) / (low! + 0.05);
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
});

describe("CtaBanner", () => {
  it.each(["light", "dark"])(
    "keeps the lead text at AA contrast on the brand panel (%s)",
    async (theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      const screen = await render(
        <CtaBanner
          action={{ href: "/register", label: "Create your account" }}
          description="Create an account in under a minute."
          title="Ready when you are"
        />,
      );
      const lead = screen
        .getByText("Create an account in under a minute.")
        .element();
      const panel = lead.closest("section")!;
      const color = getComputedStyle(lead).color;
      // Opaque text only: a translucent lead blends with the brand colour.
      expect(color).not.toMatch(/rgba?\([^)]*,\s*0?\.\d+\)/);
      expect(
        contrast(color, getComputedStyle(panel).backgroundColor),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe("FaqGrid", () => {
  it("groups each question and answer directly under the list", async () => {
    await render(
      <FaqGrid
        items={[
          { answer: "Yes, any time.", question: "Can I cancel?" },
          { answer: "Card or transfer.", question: "How do I pay?" },
        ]}
      />,
    );
    const list = document.querySelector("dl")!;
    const groups = [...list.children];
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect(group.tagName).toBe("DIV");
      expect([...group.children].map((child) => child.tagName)).toEqual([
        "DT",
        "DD",
      ]);
    }
  });
});
