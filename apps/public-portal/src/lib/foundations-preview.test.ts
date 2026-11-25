import { describe, expect, it } from "vitest";
import { isFoundationsPreviewEnabled } from "./foundations-preview";

describe("isFoundationsPreviewEnabled", () => {
  it("serves the preview only in development", () => {
    expect(isFoundationsPreviewEnabled("development")).toBe(true);
    expect(isFoundationsPreviewEnabled("production")).toBe(false);
    expect(isFoundationsPreviewEnabled("test")).toBe(false);
    expect(isFoundationsPreviewEnabled(undefined)).toBe(false);
  });
});
