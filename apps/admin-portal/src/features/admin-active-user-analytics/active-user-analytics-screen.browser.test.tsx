import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ActiveUserAnalyticsFilters } from "./active-user-analytics-model";
import { activeUserAnalyticsPreview } from "./active-user-analytics-preview.fixtures";
import { ActiveUserAnalyticsScreen } from "./active-user-analytics-screen";

const initialFilters: ActiveUserAnalyticsFilters = {
  customRange: { end: "2026-11-25", start: "2026-11-19" },
  range: "7d",
  selectedDate: null,
};

function Harness({
  onFiltersChange,
}: Readonly<{
  onFiltersChange: (filters: ActiveUserAnalyticsFilters) => void;
}>) {
  const [filters, setFilters] = useState(initialFilters);
  function change(next: ActiveUserAnalyticsFilters) {
    onFiltersChange(next);
    setFilters(next);
  }
  return (
    <ActiveUserAnalyticsScreen
      filters={filters}
      model={activeUserAnalyticsPreview}
      onFiltersChange={change}
    />
  );
}

describe("ActiveUserAnalyticsScreen", () => {
  it("selects a reporting date with the keyboard", async () => {
    const onFiltersChange = vi.fn();
    const screen = await render(<Harness onFiltersChange={onFiltersChange} />);

    screen.getByRole("button", { name: "24 Nov" }).element().focus();
    await userEvent.keyboard("{Enter}");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      selectedDate: "2026-11-24",
    });
    await expect
      .element(screen.getByText("Active on 24 Nov 2026 (UTC)"))
      .toBeVisible();

    await screen.getByLabelText("Reporting period").selectOptions("30d");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      range: "30d",
      selectedDate: null,
    });
    await expect
      .element(screen.getByText("Active users in the reporting period"))
      .toBeVisible();
  });

  it("reports a custom UTC range", async () => {
    const onFiltersChange = vi.fn();
    const screen = await render(<Harness onFiltersChange={onFiltersChange} />);

    await screen.getByLabelText("Reporting period").selectOptions("custom");
    await screen.getByLabelText("End date").fill("2026-11-22");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      customRange: { end: "2026-11-22", start: "2026-11-19" },
      range: "custom",
    });
  });
});
