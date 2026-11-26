import tailwindcss from "@tailwindcss/postcss";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Marketing chrome interaction tests in a real browser (Vitest browser mode,
 * as in ui-core): the mobile menu sheet (focus, Escape, link selection,
 * closing at `lg`), theme switching and responsive visibility with the
 * production Tailwind build of theme.css. Run with `pnpm test:component`; not part of
 * `pnpm test` (CI has no browser yet — OD-05).
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
      provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
      instances: [{ browser: "chromium" }],
      screenshotFailures: false,
      viewport: { width: 1440, height: 900 },
    },
  },
});
