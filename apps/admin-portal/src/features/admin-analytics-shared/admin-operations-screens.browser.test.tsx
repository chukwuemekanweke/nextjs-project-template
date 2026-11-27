import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AuditScreen } from "../admin-audit/audit-screen";
import { auditPreview } from "../admin-audit/audit-preview.fixtures";
import { RegistrationAnalyticsScreen } from "../admin-registration-analytics/registration-analytics-screen";
import { registrationAnalyticsPreview } from "../admin-registration-analytics/registration-analytics-preview.fixtures";
import { SystemHealthScreen } from "../admin-system-health/system-health-screen";
import { systemHealthPreview } from "../admin-system-health/system-health-preview.fixtures";

describe("FE-UI-015 controlled intents", () => {
  it("reports reporting-range and granularity changes", async () => {
    const onFiltersChange = vi.fn();
    const screen = await render(
      <RegistrationAnalyticsScreen
        filters={{ granularity: "day", range: "30d" }}
        model={registrationAnalyticsPreview}
        onFiltersChange={onFiltersChange}
      />,
    );

    await screen.getByLabelText("Reporting period").selectOptions("90d");
    expect(onFiltersChange).toHaveBeenCalledWith({
      granularity: "day",
      range: "90d",
    });

    await screen.getByLabelText("Granularity").selectOptions("week");
    expect(onFiltersChange).toHaveBeenCalledWith({
      granularity: "week",
      range: "30d",
    });
  });

  it("reports audit export without manufacturing completion", async () => {
    const onAction = vi.fn();
    const screen = await render(
      <AuditScreen
        filters={{ action: "", actor: "", query: "", range: "30d" }}
        model={auditPreview}
        onAction={onAction}
      />,
    );

    await screen.getByRole("button", { name: "Export CSV" }).click();
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith({ type: "exportCsv" });
    await expect.element(screen.getByText("Audit history")).toBeInTheDocument();
  });

  it("reports refresh and keeps unknown service health visible", async () => {
    const onRefresh = vi.fn();
    const screen = await render(
      <SystemHealthScreen model={systemHealthPreview} onRefresh={onRefresh} />,
    );

    await screen.getByRole("button", { name: "Refresh" }).click();
    expect(onRefresh).toHaveBeenCalledOnce();
    await expect.element(screen.getByText("Unknown")).toBeVisible();
  });
});
