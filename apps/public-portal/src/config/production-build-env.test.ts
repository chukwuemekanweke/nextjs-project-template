import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

// apps/<portal>/.env.production is compiled into the production image by
// `next build`. Everything in it reaches browsers, so it must stay public.
const productionBuildEnvironment = parseEnvironmentFile(
  readFileSync(new URL("../../.env.production", import.meta.url), "utf8"),
);

describe(".env.production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("contains only browser-visible NEXT_PUBLIC_* values", () => {
    const keys = Object.keys(productionBuildEnvironment);

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key).toMatch(/^NEXT_PUBLIC_[A-Z0-9_]+$/);
      expect(key).not.toMatch(/SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL/);
    }
  });

  it("targets production without local development endpoints", () => {
    expect(productionBuildEnvironment.NEXT_PUBLIC_APP_ENVIRONMENT).toBe(
      "production",
    );
    for (const value of Object.values(productionBuildEnvironment)) {
      expect(value).not.toMatch(/localhost|127\.0\.0\.1/);
    }
  });

  it("satisfies the portal's browser configuration schema", async () => {
    for (const [key, value] of Object.entries(productionBuildEnvironment)) {
      vi.stubEnv(key, value);
    }

    const { env } = await import("./env");

    expect(env.appEnvironment).toBe("production");
  });
});

function parseEnvironmentFile(text: string): Record<string, string> {
  const entries = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator < 1) {
        throw new Error(`Malformed .env.production line: ${line}`);
      }
      const value = line.slice(separator + 1).trim();
      return [
        line.slice(0, separator).trim(),
        value.replace(/^"(.*)"$/, "$1"),
      ] as const;
    });
  return Object.fromEntries(entries);
}
