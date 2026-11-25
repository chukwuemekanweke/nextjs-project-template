import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";

/**
 * UI workbench (TD-15): isolated previews of the shared components in
 * `@template/ui-core` and `@template/dashboard-ui`, with theme and viewport
 * toolbars and the accessibility panel. Private developer tooling — never
 * deployed, and fixtures here are never imported by application code.
 * Tailwind runs through postcss.config.mjs, as in the apps.
 */
const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y"],
  core: { disableTelemetry: true },
  framework: { name: "@storybook/react-vite", options: {} },
  stories: ["../src/**/*.stories.tsx"],
  viteFinal: async (viteConfig) => {
    const { mergeConfig } = await import("vite");
    return mergeConfig(viteConfig, {
      // Workspace packages use the Next.js tsconfig (`jsx: preserve`);
      // compile their JSX here instead.
      oxc: { jsx: { runtime: "automatic" } },
      resolve: {
        alias: {
          // Components use next/link; outside Next.js an anchor is equivalent.
          "next/link": fileURLToPath(
            new URL("../src/support/next-link.tsx", import.meta.url),
          ),
        },
      },
    });
  },
};

export default config;
