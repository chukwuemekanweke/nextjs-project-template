import { ApiError } from "@template/api-client";
import { describe, expect, it, vi } from "vitest";
import { countMetric, moneyMetric } from "./admin-metric";
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  categoryBand,
  chartScaleMax,
  groupedBars,
  linePath,
} from "./chart-geometry";
import { chartSummary } from "./chart-section";
import { copyForbiddenDetails } from "./forbidden";
import {
  forbiddenDetailsFromError,
  formatForbiddenDetails,
  safePermissionName,
  sanitizeForbiddenDetails,
} from "./forbidden-details";
import { decideStepUpSubmit, validateStepUp } from "./step-up-form";
import {
  formatUtcRange,
  isValidUtcDateRange,
  parseAdminRangePreset,
  resolveUtcRange,
} from "./utc-range";

describe("admin metrics", () => {
  it("formats a real zero but treats a missing count as unavailable", () => {
    expect(countMetric(0)).toEqual({ state: "ready", value: "0" });
    expect(countMetric(12480)).toEqual({ state: "ready", value: "12,480" });
    expect(countMetric(null).state).toBe("unavailable");
    expect(countMetric(undefined).state).toBe("unavailable");
    expect(countMetric(-1).state).toBe("unavailable");
    expect(countMetric(1.5).state).toBe("unavailable");
  });

  it("never formats money without a currency", () => {
    expect(moneyMetric(150000, null)).toEqual({
      reason: "Currency not reported.",
      state: "unavailable",
    });
    expect(moneyMetric(null, "NGN").state).toBe("unavailable");
    const ready = moneyMetric(150000, "ngn");
    expect(ready.state).toBe("ready");
    expect(ready.state === "ready" && ready.value).toMatch(/^NGN\s1,500\.00$/);
  });
});

describe("chart geometry", () => {
  it("rounds the scale up and never divides by zero", () => {
    expect(chartScaleMax([[0, 0]])).toBe(1);
    expect(chartScaleMax([[null]])).toBe(1);
    expect(chartScaleMax([[3, 7], [12]])).toBe(20);
    expect(chartScaleMax([[4210]])).toBe(5000);
  });

  it("leaves gaps for missing points instead of drawing zero", () => {
    const path = linePath([10, null, 10], 10);
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path).not.toContain(`${CHART_HEIGHT}`);
  });

  it("draws one bar per reported value", () => {
    const bars = groupedBars(
      [
        [1, 2],
        [null, 1],
      ],
      2,
      2,
    );
    expect(bars).toHaveLength(3);
    expect(bars.every((bar) => bar.height >= 0 && bar.width > 0)).toBe(true);
    expect(groupedBars([], 3, 1)).toEqual([]);
  });

  it("summarises every chart state in text", () => {
    expect(
      chartSummary("Payments", { reason: "No API.", state: "unavailable" }),
    ).toBe("Payments: not available. No API.");
    expect(chartSummary("Payments", { state: "loading" })).toContain("loading");
    expect(
      chartSummary("Payments", { message: "boom", state: "error" }),
    ).not.toContain("boom");
  });
});

describe("chart category bands", () => {
  it("covers a bar group and clips a line band to the plot", () => {
    expect(categoryBand(1, 4, "bars")).toEqual({
      width: CHART_WIDTH / 4,
      x: CHART_WIDTH / 4,
    });
    expect(categoryBand(0, 4, "line")).toEqual({
      width: CHART_WIDTH / 8,
      x: 0,
    });
    const last = categoryBand(3, 4, "line");
    expect(last.x + last.width).toBe(CHART_WIDTH);
  });
});

describe("UTC reporting periods", () => {
  it("accepts only real, ordered custom ranges", () => {
    expect(
      isValidUtcDateRange({ end: "2026-11-25", start: "2026-11-01" }),
    ).toBe(true);
    expect(
      isValidUtcDateRange({ end: "2026-11-25", start: "2026-11-25" }),
    ).toBe(true);
    expect(
      isValidUtcDateRange({ end: "2026-11-01", start: "2026-11-25" }),
    ).toBe(false);
    expect(
      isValidUtcDateRange({ end: "2026-02-30", start: "2026-02-01" }),
    ).toBe(false);
    expect(isValidUtcDateRange({ end: "", start: "2026-02-01" })).toBe(false);
  });

  it("resolves inclusive UTC days regardless of local time", () => {
    expect(
      resolveUtcRange("30d", new Date("2026-11-25T23:30:00-05:00")),
    ).toEqual({ end: "2026-11-26", start: "2026-10-28" });
    expect(resolveUtcRange("7d", new Date("2026-11-25T08:00:00Z"))).toEqual({
      end: "2026-11-25",
      start: "2026-11-19",
    });
  });

  it("labels ranges as UTC", () => {
    expect(formatUtcRange({ end: "2026-11-25", start: "2026-10-27" })).toBe(
      "27 Oct – 25 Nov 2026 (UTC)",
    );
    expect(formatUtcRange({ end: "2027-01-05", start: "2026-12-07" })).toBe(
      "7 Dec 2026 – 5 Jan 2027 (UTC)",
    );
  });

  it("accepts only known presets as filter intent", () => {
    expect(parseAdminRangePreset("90d")).toBe("90d");
    expect(parseAdminRangePreset("365d")).toBeNull();
    expect(parseAdminRangePreset(undefined)).toBeNull();
  });
});

describe("forbidden details", () => {
  it("copies only allow-listed, non-secret fields", () => {
    const text = formatForbiddenDetails({
      occurredAt: "2026-11-25T10:00:00Z",
      path: "/analytics/payments?email=ada@example.com#top",
      requestId: "00-abc123-01",
    });
    expect(text).toBe(
      [
        "Status: 403 Forbidden",
        "Path: /analytics/payments",
        "Request ID: 00-abc123-01",
        "Time (UTC): 2026-11-25T10:00:00.000Z",
      ].join("\n"),
    );
    expect(text).not.toContain("ada@example.com");
  });

  it("drops unsafe ids, external paths and invalid dates", () => {
    expect(
      sanitizeForbiddenDetails({
        occurredAt: "not a date",
        path: "//evil.example/x",
        requestId: "Bearer eyJ.token value",
      }),
    ).toEqual({});
  });

  it("shows a permission name only when it is a plain identifier", () => {
    expect(safePermissionName("payments.analytics.read")).toBe(
      "payments.analytics.read",
    );
    expect(safePermissionName("<script>")).toBeUndefined();
    expect(safePermissionName(undefined)).toBeUndefined();
  });

  it("reads only the correlation id from a 403 ApiError", () => {
    const error = new ApiError({
      correlationId: "corr-42",
      detail: "Internal policy PaymentsReaders failed for user 17",
      kind: "forbidden",
      safeMessage: "Forbidden",
      status: 403,
    });
    expect(
      forbiddenDetailsFromError(error, { path: "/users/17?tab=roles" }),
    ).toEqual({ path: "/users/17", requestId: "corr-42" });
    expect(
      forbiddenDetailsFromError(
        new ApiError({ kind: "server", safeMessage: "x", status: 500 }),
      ),
    ).toBeNull();
    expect(forbiddenDetailsFromError(new Error("403"))).toBeNull();
  });

  it("reports copy success and failure without throwing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyForbiddenDetails("x", { writeText })).resolves.toBe(
      "copied",
    );
    expect(writeText).toHaveBeenCalledWith("x");
    await expect(
      copyForbiddenDetails("x", {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      }),
    ).resolves.toBe("failed");
    await expect(copyForbiddenDetails("x", undefined)).resolves.toBe("failed");
  });
});

describe("step-up submission", () => {
  const withReason = {
    codeLength: 6,
    reason: { label: "Reason", required: true, maxLength: 20 },
  };

  it("requires a complete numeric code and a required reason", () => {
    expect(validateStepUp({ code: "123", reason: " " }, withReason)).toEqual({
      code: "Enter the 6-digit code from your authenticator app.",
      reason: "Enter a reason for this action.",
    });
    expect(
      validateStepUp({ code: "123456", reason: "x".repeat(21) }, withReason)
        .reason,
    ).toBe("Keep the reason under 21 characters.");
  });

  it("submits the normalised code and trimmed reason", () => {
    expect(
      decideStepUpSubmit(
        { code: "123 456", reason: "  Reported takeover " },
        withReason,
        false,
      ),
    ).toEqual({
      kind: "submit",
      submission: { code: "123456", reason: "Reported takeover" },
    });
  });

  it("omits the reason when the contract has none", () => {
    expect(
      decideStepUpSubmit(
        { code: "123456", reason: "ignored" },
        { codeLength: 6 },
        false,
      ),
    ).toEqual({ kind: "submit", submission: { code: "123456" } });
  });

  it("blocks duplicate submission while pending", () => {
    expect(
      decideStepUpSubmit({ code: "123456", reason: "ok" }, withReason, true),
    ).toEqual({ kind: "blocked" });
  });
});
