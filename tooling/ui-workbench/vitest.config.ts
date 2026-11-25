import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Visual regression for the workbench stories (TD-17 scope, run with Vitest
 * browser mode `toMatchScreenshot`). Baselines live in
 * visual/__screenshots__ and are platform-specific; update them only with
 * `pnpm test:visual -u` and review the image diff in the PR.
 */
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  optimizeDeps: {
    include: [
      "@storybook/react",
      "class-variance-authority",
      "clsx",
      "lucide-react",
      "radix-ui",
      "react",
      "react-dom",
      "react/jsx-dev-runtime",
      "tailwind-merge",
      "vitest-browser-react",
    ],
  },
  resolve: {
    alias: {
      "next/link": fileURLToPath(
        new URL("./src/support/next-link.tsx", import.meta.url),
      ),
    },
  },
  test: {
    include: ["visual/**/*.visual.test.tsx"],
    setupFiles: ["./visual/setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: {
          reducedMotion: "reduce",
          // Room for the tallest artboard, so the test iframe is never scaled
          // down to fit the window (scaling changes screenshot dimensions).
          viewport: { height: 4000, width: 1600 },
        },
      }),
      instances: [{ browser: "chromium" }],
      screenshotFailures: false,
      viewport: { width: 1440, height: 900 },
      expect: {
        toMatchScreenshot: {
          comparatorName: "pixelmatch",
          comparatorOptions: { allowedMismatchedPixelRatio: 0.001 },
        },
      },
    },
  },
});
