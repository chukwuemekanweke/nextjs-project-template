import tailwindcss from "@tailwindcss/postcss";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Component interaction tests in a real browser (Vitest browser mode, TD-16):
 * keyboard, focus, ARIA state and responsive layout with the production
 * Tailwind build of theme.css. Run with `pnpm test:component` after
 * `pnpm exec playwright install chromium`. Not part of `pnpm test` (CI has
 * no browser yet — OD-05).
 */
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  oxc: { jsx: { runtime: "automatic" } },
  optimizeDeps: {
    include: [
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
      // next/link needs the Next.js runtime; a plain anchor is equivalent here.
      "next/link": fileURLToPath(
        new URL("./test/next-link.tsx", import.meta.url),
      ),
    },
  },
  test: {
    include: ["src/**/*.browser.test.tsx"],
    setupFiles: ["./test/browser-setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      // Reduced motion keeps transitions deterministic and lets tests assert
      // the motion-safe behaviour.
      provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
      instances: [{ browser: "chromium" }],
      screenshotFailures: false,
      viewport: { width: 1440, height: 900 },
    },
  },
});
