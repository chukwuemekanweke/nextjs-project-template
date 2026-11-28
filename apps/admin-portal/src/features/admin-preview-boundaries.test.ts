import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * Cross-feature production boundaries for preview-only admin screens:
 * preview fixtures never reach production modules, and screens without an
 * admin API (FE-UI-015, DR-134; invoices FE-UI-018, DR-160) have no
 * published route.
 */

const src = fileURLToPath(new URL("../", import.meta.url));

const unpublishedRoutes = [
  "analytics/registrations",
  "analytics/active-users",
  "analytics/payments",
  "analytics/subscriptions",
  "providers",
  "reference-data",
  "audit",
  "system-health",
  "invoices",
];

describe("admin preview boundaries", () => {
  it("keeps preview fixtures out of production modules", () => {
    const productionFiles = walk(src).filter(
      (path) =>
        /\.(ts|tsx)$/.test(path) && !/\.test\.|preview\.fixtures\./.test(path),
    );
    for (const file of productionFiles) {
      expect(readFileSync(file, "utf8")).not.toMatch(
        /from\s+["'][^"']*preview\.fixtures["']/,
      );
    }
  });

  it("publishes no route for API-less operational screens", () => {
    for (const route of unpublishedRoutes) {
      expect(existsAt(join(src, "app", route, "page.tsx"))).toBe(false);
    }
  });
});

function walk(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    if (statSync(path).isDirectory()) {
      return walk(path);
    }
    return [path];
  });
}

function existsAt(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}
