import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's default scale names. Register the
 * custom theme keys from `theme.css` so they merge predictably — without this,
 * `text-body` (a font size) and `text-fg` (a colour) would be treated as the
 * same group and one of them silently dropped.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "section",
        "h1",
        "h2",
        "h3",
        "lead",
        "stat",
        "price",
        "body",
        "label",
        "small",
        "caption",
        "overline",
        "micro",
        "mono",
      ],
      spacing: [
        "control",
        "control-sm",
        "touch",
        "icon-xs",
        "icon-sm",
        "icon-md",
        "icon-lg",
        "page",
        "card",
        "topbar-x",
        "sidebar",
        "topbar",
        "topbar-mobile",
        "tabbar-item",
        "nav-drawer",
        "drawer",
        "section",
      ],
      container: ["content", "marketing", "dialog", "auth-form"],
    },
    classGroups: {
      z: [
        { z: ["sticky", "tabbar", "overlay", "drawer", "popover", "tooltip"] },
      ],
    },
  },
});

/**
 * Compose class names: conditional parts via `clsx`, then conflicting
 * Tailwind utilities resolved so the last one wins. Components pass the
 * consumer's `className` last, so callers can override any default.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Join optional element ids for `aria-describedby` / `aria-labelledby`. */
export function joinIds(
  ...ids: Array<string | false | null | undefined>
): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined || undefined;
}
