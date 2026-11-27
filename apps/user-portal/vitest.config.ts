import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

// Node tests (`pnpm test`). Browser tests (`*.browser.test.tsx`) run with
// vitest.browser.config.ts (`pnpm test:component`).
export default defineConfig({
  oxc: {
    jsx: { runtime: "automatic" },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "**/*.browser.test.tsx"],
  },
});
