import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("package boundaries", () => {
  it("exposes only supported public subpaths", async () => {
    const manifest = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    ) as { exports: Record<string, string> };
    expect(Object.keys(manifest.exports).sort()).toEqual([
      ".",
      "./authentication",
      "./browser",
      "./payments",
      "./profiles",
      "./providers",
      "./reference-data",
      "./server",
      "./transport",
    ]);
  });

  it("marks the server entrypoint and keeps the browser entrypoint server-free", async () => {
    const serverSource = await readFile(
      new URL("./server/server-client.ts", import.meta.url),
      "utf8",
    );
    const browserSource = await readFile(
      new URL("./browser/browser-client.ts", import.meta.url),
      "utf8",
    );
    expect(serverSource).toContain('import "server-only"');
    expect(browserSource).not.toMatch(/server-only|next\/headers|process\.env/);
  });
});
