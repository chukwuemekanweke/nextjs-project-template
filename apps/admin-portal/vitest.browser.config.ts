import tailwindcss from "@tailwindcss/postcss";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Feature interaction tests in a real browser (`*.browser.test.tsx`,
 * `pnpm test:component`): form input, confirmation lifecycles, pending
 * state and stale-data handling that static rendering cannot exercise.
 * Feature compositions only; no route, session or network. Not part of
 * `pnpm test` (CI has no browser yet, OD-05).
 */
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  oxc: { jsx: { runtime: "automatic" } },
  optimizeDeps: {
    include: [
      // Dependencies of workspace packages, pre-bundled through them.
      "@template/forms > @hookform/resolvers/zod",
      "@template/forms > react-hook-form",
      "@template/ui-core > class-variance-authority",
      "@template/ui-core > clsx",
      "@template/ui-core > lucide-react",
      "@template/ui-core > radix-ui",
      "@template/ui-core > tailwind-merge",
      "react",
      "react-dom",
      "react/jsx-dev-runtime",
      "vitest-browser-react",
      "zod",
    ],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // next/link needs the Next.js runtime; a plain anchor is equivalent here.
      "next/link": fileURLToPath(
        new URL("../../packages/ui-core/test/next-link.tsx", import.meta.url),
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
