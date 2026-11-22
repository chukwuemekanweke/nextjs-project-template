import { describe, expect, it } from "vitest";
import { dynamic, GET } from "./route";

describe("GET /api/health", () => {
  it("reports a healthy, uncached response without authentication", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("is rendered per request rather than prerendered at build time", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
