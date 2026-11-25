import { defineConfig, globalIgnores } from "eslint/config";
import base from "@template/eslint-config/next";

export default defineConfig([
  ...base,
  globalIgnores(["storybook-static/**", "**/__screenshots__/**"]),
  {
    settings: { next: { rootDir: "." } },
    rules: {
      // Not a Next.js app: no pages directory.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);
