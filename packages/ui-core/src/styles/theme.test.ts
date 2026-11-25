import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Verifies theme.css against the pinned design reference (d23eb85, `.tp` and
// `.tp.dark`) and computes WCAG 2.2 contrast from the stylesheet itself, so a
// token edit that breaks the reference or accessibility fails here.

const css = readFileSync(
  new URL("./theme.css", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

function declarations(block: string): Map<string, string> {
  const result = new Map<string, string>();
  const withoutComments = block.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of withoutComments.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    result.set(match[1]!, match[2]!.replace(/\s+/g, " ").trim());
  }
  return result;
}

function blockAfter(marker: string): string {
  const start = css.indexOf(marker);
  if (start < 0) throw new Error(`Missing block ${marker}`);
  let depth = 0;
  for (let index = css.indexOf("{", start); index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(start, index + 1);
  }
  throw new Error(`Unclosed block ${marker}`);
}

const palette = declarations(blockAfter("@layer theme {\n  :root {"));
const light = new Map([
  ...palette,
  ...declarations(blockAfter("@theme static {")),
]);
const dark = new Map([...light, ...declarations(blockAfter("  .dark {"))]);

type Rgba = Readonly<{ a: number; b: number; g: number; r: number }>;

function resolve(value: string, scope: Map<string, string>, depth = 0): string {
  if (depth > 10) throw new Error(`Cyclic token: ${value}`);
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    const next = scope.get(name);
    if (!next) throw new Error(`Undefined token ${name}`);
    return resolve(next, scope, depth + 1);
  });
}

function parseColor(raw: string): Rgba {
  const value = raw.trim().toLowerCase();
  const hex = /^#([0-9a-f]{6})$/.exec(value);
  if (hex) {
    const n = Number.parseInt(hex[1]!, 16);
    return { a: 1, b: n & 255, g: (n >> 8) & 255, r: (n >> 16) & 255 };
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value);
  if (rgb) {
    return {
      a: Number(rgb[4]),
      b: Number(rgb[3]),
      g: Number(rgb[2]),
      r: Number(rgb[1]),
    };
  }
  const mix = /^color-mix\( ?in srgb, (.+) (\d+)%, transparent ?\)$/.exec(
    value,
  );
  if (mix) {
    const base = parseColor(mix[1]!);
    return { ...base, a: (base.a * Number(mix[2])) / 100 };
  }
  throw new Error(`Unsupported colour ${raw}`);
}

function token(scope: Map<string, string>, name: string): Rgba {
  const value = scope.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return parseColor(resolve(value, scope));
}

function over(top: Rgba, bottom: Rgba): Rgba {
  return {
    a: 1,
    b: top.b * top.a + bottom.b * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    r: top.r * top.a + bottom.r * (1 - top.a),
  };
}

function luminance({ b, g, r }: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(
  scope: Map<string, string>,
  foreground: string,
  background: string,
): number {
  const page = token(scope, "--color-surface");
  const bg = over(token(scope, background), page);
  const fg = over(token(scope, foreground), bg);
  const [high, low] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

function hex(scope: Map<string, string>, name: string): string {
  const { a, b, g, r } = token(scope, name);
  const body = [r, g, b]
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return a === 1 ? `#${body}` : `#${body}@${Number(a.toFixed(2))}`;
}

// Reference values: docs/design-system/token-mapping.md §2.
const reference: ReadonlyArray<[string, string, string]> = [
  ["--color-bg", "#F5F7FB", "#0F0F11"],
  ["--color-surface", "#FFFFFF", "#18181B"],
  ["--color-surface-2", "#F8FAFC", "#1C1C20"],
  ["--color-surface-3", "#F1F5F9", "#232327"],
  ["--color-hover", "#F1F5F9", "#26262B"],
  ["--color-border", "#E4E7EC", "#2A2A2F"],
  ["--color-border-strong", "#D0D5DD", "#3A3A40"],
  ["--color-fg", "#0F172A", "#F4F4F5"],
  ["--color-fg-muted", "#475467", "#B4B4BC"],
  ["--color-fg-subtle", "#5D6B82", "#9A9AA3"],
  ["--color-brand", "#2563EB", "#2563EB"],
  // Dark hover is #3B6FF0 in the reference; #3A6EEF meets 4.5:1 (DR-076).
  ["--color-brand-hover", "#1D4ED8", "#3A6EEF"],
  ["--color-brand-press", "#1E40AF", "#1D4ED8"],
  ["--color-brand-soft", "#EFF6FF", "#60A5FA@0.12"],
  ["--color-brand-soft-2", "#DBEAFE", "#60A5FA@0.2"],
  ["--color-brand-ink", "#1D4ED8", "#93C5FD"],
  ["--color-on-brand", "#FFFFFF", "#FFFFFF"],
  ["--color-nav-bg", "#FFFFFF", "#141416"],
  ["--color-nav-active-bg", "#EFF6FF", "#26262B"],
  ["--color-nav-active-fg", "#1D4ED8", "#FFFFFF"],
  ["--color-success", "#067647", "#4ADE80"],
  ["--color-success-bg", "#ECFDF3", "#4ADE80@0.12"],
  ["--color-warning", "#B54708", "#FBBF24"],
  ["--color-warning-bg", "#FFFAEB", "#FBBF24@0.12"],
  ["--color-danger", "#B42318", "#F87171"],
  ["--color-danger-bg", "#FEF3F2", "#F87171@0.12"],
  ["--color-danger-solid", "#B42318", "#DC2626"],
  ["--color-info", "#1D4ED8", "#93C5FD"],
  ["--color-info-bg", "#EFF6FF", "#60A5FA@0.12"],
  ["--color-neutral-bg", "#F2F4F7", "#26262B"],
  ["--color-chart-1", "#2563EB", "#60A5FA"],
  ["--color-chart-2", "#93C5FD", "#3F3F46"],
  ["--color-chart-3", "#F59E0B", "#FBBF24"],
  ["--color-chart-4", "#0F766E", "#2DD4BF"],
  ["--color-grid", "#EEF1F5", "#26262B"],
  ["--color-scrim", "#0F172A@0.45", "#000000@0.6"],
];

describe("theme.css semantic colours", () => {
  it.each(reference)("%s matches the reference", (name, lightHex, darkHex) => {
    expect(hex(light, name)).toBe(lightHex);
    expect(hex(dark, name)).toBe(darkHex);
  });

  it("defines a dark override for every theme-dependent token", () => {
    const darkOnly = declarations(blockAfter("  .dark {"));
    for (const [name, lightValue, darkValue] of reference) {
      if (lightValue !== darkValue) expect(darkOnly.has(name), name).toBe(true);
    }
  });
});

const textPairs: ReadonlyArray<[string, string]> = [
  ["--color-fg", "--color-bg"],
  ["--color-fg", "--color-surface"],
  ["--color-fg-muted", "--color-surface"],
  ["--color-fg-muted", "--color-surface-3"],
  ["--color-fg-subtle", "--color-bg"],
  ["--color-fg-subtle", "--color-surface"],
  ["--color-fg-subtle", "--color-surface-2"],
  ["--color-on-brand", "--color-brand"],
  ["--color-on-brand", "--color-brand-hover"],
  ["--color-brand-ink", "--color-surface"],
  ["--color-brand-ink", "--color-brand-soft"],
  ["--color-nav-active-fg", "--color-nav-active-bg"],
  ["--color-success", "--color-success-bg"],
  ["--color-warning", "--color-warning-bg"],
  ["--color-danger", "--color-danger-bg"],
  ["--color-danger", "--color-surface"],
  ["--color-info", "--color-info-bg"],
  ["--color-neutral", "--color-neutral-bg"],
  ["--color-on-danger", "--color-danger-solid"],
  ["--color-chart-axis", "--color-surface"],
];

// WCAG 1.4.11: control boundaries and focus indicators need 3:1.
const nonTextPairs: ReadonlyArray<[string, string]> = [
  ["--color-control-border", "--color-surface"],
  ["--color-control-border", "--color-bg"],
  ["--color-control-border", "--color-surface-2"],
  ["--color-switch-track", "--color-surface"],
  ["--color-focus", "--color-surface"],
  ["--color-focus", "--color-bg"],
];

describe.each([
  ["light", light],
  ["dark", dark],
] as const)("%s theme contrast (WCAG 2.2 AA)", (_, scope) => {
  it.each(textPairs)("text %s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(scope, fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(nonTextPairs)("%s against %s is at least 3:1", (fg, bg) => {
    expect(contrast(scope, fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it("keeps the reference border-strong below 3:1 (documented DR-029)", () => {
    // Decorative separators may use border-strong; form controls must use
    // control-border. If this starts passing, revisit DR-029.
    expect(
      contrast(scope, "--color-border-strong", "--color-surface"),
    ).toBeLessThan(3);
  });
});

describe("theme.css scales", () => {
  const statics = declarations(blockAfter("@theme {"));

  it("uses the reference radius scale", () => {
    expect(
      ["sm", "md", "lg", "xl", "2xl"].map((k) => statics.get(`--radius-${k}`)),
    ).toEqual(["8px", "10px", "12px", "14px", "18px"]);
  });

  it("centralises the layer order", () => {
    expect(
      ["sticky", "tabbar", "overlay", "drawer", "popover", "tooltip"].map((k) =>
        statics.get(`--z-index-${k}`),
      ),
    ).toEqual(["20", "30", "40", "50", "60", "70"]);
  });

  it("does not redefine Tailwind's default breakpoints", () => {
    expect(css).not.toMatch(/--breakpoint-/);
  });

  it("uses theme-specific elevation with no dark card shadows", () => {
    const darkOnly = declarations(blockAfter("  .dark {"));
    expect(darkOnly.get("--elevation-xs")).toBe("none");
    expect(darkOnly.get("--elevation-sm")).toBe("none");
    expect(darkOnly.get("--elevation-lg")).toBe("0 16px 40px rgb(0 0 0 / 0.5)");
  });

  it("maps fonts to the next/font variables loaded by each app", () => {
    expect(statics.get("--font-sans")).toContain("var(--font-outfit-loaded");
    expect(statics.get("--font-mono")).toContain(
      "var(--font-jetbrains-mono-loaded",
    );
  });
});
