import tailwindcss from "@tailwindcss/postcss";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Connected-field interaction tests in a real browser (TD-16): React Hook
 * Form registration, validation and error presentation on the shared
 * ui-core controls. `pnpm test:component`; not part of `pnpm test` (OD-05).
 */
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  oxc: { jsx: { runtime: "automatic" } },
  optimizeDeps: {
    include: [
      "@hookform/resolvers/zod",
      "react",
      "react-dom",
      "react-hook-form",
      "react/jsx-dev-runtime",
      "vitest-browser-react",
      "zod",
    ],
  },
  resolve: {
    alias: {
      // next/link (reached through ui-core) needs the Next.js runtime.
      "next/link": fileURLToPath(
        new URL("../ui-core/test/next-link.tsx", import.meta.url),
      ),
    },
  },
  test: {
    include: ["src/**/*.browser.test.tsx"],
    setupFiles: ["./test/browser-setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
      instances: [{ browser: "chromium" }],
      screenshotFailures: false,
      viewport: { width: 1440, height: 900 },
    },
  },
});
