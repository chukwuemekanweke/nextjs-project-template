"use client";

import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";
import type { ComponentType } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "../components/icons";
import type { IconProps } from "../components/icons";
import { Switch } from "../components/switch";
import type { ThemePreference } from "./theme-config";

const noopSubscribe = () => () => undefined;

/**
 * False during server rendering and hydration, true afterwards. The stored
 * preference is unknown on the server, so state-dependent attributes are
 * rendered only once this is true; this avoids hydration mismatches.
 */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Compact light/dark switch for top bars and drawers. The icon follows the
 * `.dark` class that next-themes applies before paint, so it is correct on
 * first render without waiting for hydration.
 */
export function ThemeSwitch({
  className = "",
}: Readonly<{ className?: string }>) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <button
      aria-label="Dark theme"
      aria-pressed={hydrated ? resolvedTheme === "dark" : undefined}
      className={[
        "size-control text-fg-muted hover:bg-hover hover:text-fg inline-flex shrink-0 items-center justify-center rounded-md transition-colors",
        className,
      ].join(" ")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      type="button"
    >
      <MoonIcon className="size-icon-md dark:hidden" />
      <SunIcon className="size-icon-md hidden dark:block" />
    </button>
  );
}

/**
 * Labelled "Dark mode" switch for navigation drawers (reference
 * `.m-drawer .side-foot`). Choosing a side sets an explicit light or dark
 * preference; the Preferences page (`ThemeSelect`) restores "System". The
 * switch reports no state until hydration (the stored preference is unknown
 * on the server); drawers are closed at that point.
 */
export function DarkModeSwitch({
  className = "",
  label = "Dark mode",
}: Readonly<{ className?: string; label?: string }>) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const id = useId();

  return (
    <div
      className={["flex items-center justify-between gap-3", className].join(
        " ",
      )}
    >
      <label className="text-small text-fg" htmlFor={id}>
        {label}
      </label>
      <Switch
        checked={hydrated && resolvedTheme === "dark"}
        id={id}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}

const themeOptions: ReadonlyArray<{
  icon: ComponentType<IconProps>;
  label: string;
  value: ThemePreference;
}> = [
  { icon: SunIcon, label: "Light", value: "light" },
  { icon: MoonIcon, label: "Dark", value: "dark" },
  { icon: MonitorIcon, label: "System", value: "system" },
];

/**
 * Explicit Light / Dark / System choice as a segmented radio group. Native
 * radios provide arrow-key navigation and screen-reader semantics.
 */
export function ThemeSelect({
  className = "",
  label = "Theme",
}: Readonly<{ className?: string; label?: string }>) {
  const { setTheme, theme } = useTheme();
  const hydrated = useHydrated();
  const name = useId();

  return (
    <fieldset className={["min-w-0", className].join(" ")}>
      <legend className="sr-only">{label}</legend>
      <div className="border-border bg-surface-3 inline-flex gap-1 rounded-lg border p-1">
        {themeOptions.map(({ icon: Icon, label: optionLabel, value }) => (
          <label
            className="min-h-control-sm text-label text-fg-muted hover:text-fg has-checked:bg-surface-selected has-checked:text-fg has-focus-visible:outline-focus inline-flex cursor-pointer items-center gap-2 rounded-sm px-3 transition-colors has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
            key={value}
          >
            <input
              checked={hydrated && theme === value}
              className="sr-only"
              name={name}
              onChange={() => setTheme(value)}
              type="radio"
              value={value}
            />
            <Icon className="size-icon-xs" />
            {optionLabel}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
