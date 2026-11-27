import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type {
  RegistrationAnalyticsFilters,
  RegistrationAnalyticsModel,
} from "./registration-analytics-model";
import { registrationAnalyticsPreview } from "./registration-analytics-preview.fixtures";
import { RegistrationAnalyticsScreen } from "./registration-analytics-screen";

const initialFilters: RegistrationAnalyticsFilters = {
  customRange: { end: "2026-11-25", start: "2026-10-27" },
  granularity: "day",
  query: "",
  range: "30d",
  selectedPeriod: null,
};

const previewUsers = registrationAnalyticsPreview.users;
if (previewUsers.state !== "ready") {
  throw new Error("Registration preview users must be ready.");
}
const twoPages: RegistrationAnalyticsModel = {
  ...registrationAnalyticsPreview,
  users: { ...previewUsers, totalItems: 21, totalPages: 2 },
};

/** Owns the controlled filters, as a page container would. */
function Harness({
  model = registrationAnalyticsPreview,
  onFiltersChange,
  onPageChange,
}: Readonly<{
  model?: RegistrationAnalyticsModel;
  onFiltersChange: (filters: RegistrationAnalyticsFilters) => void;
  onPageChange?: (page: number) => void;
}>) {
  const [filters, setFilters] = useState(initialFilters);
  function change(next: RegistrationAnalyticsFilters) {
    onFiltersChange(next);
    setFilters(next);
  }
  return (
    <RegistrationAnalyticsScreen
      filters={filters}
      model={model}
      onFiltersChange={change}
      onPageChange={onPageChange}
    />
  );
}

describe("RegistrationAnalyticsScreen", () => {
  it("drills into a chart period and lists that period's users", async () => {
    const onFiltersChange = vi.fn();
    const screen = await render(<Harness onFiltersChange={onFiltersChange} />);

    await screen.getByRole("button", { name: "24 Nov" }).click();
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      selectedPeriod: { end: "2026-11-24", start: "2026-11-24" },
    });
    await expect
      .element(screen.getByRole("button", { name: "24 Nov" }))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(screen.getByText("Users registered 24 Nov – 24 Nov 2026 (UTC)"))
      .toBeVisible();

    await screen.getByLabelText("Granularity").selectOptions("week");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      granularity: "week",
      selectedPeriod: null,
    });
    await expect
      .element(screen.getByText("Users registered in the reporting period"))
      .toBeVisible();
  });

  it("reports a valid custom UTC range and ignores an inverted one", async () => {
    const onFiltersChange = vi.fn();
    const screen = await render(<Harness onFiltersChange={onFiltersChange} />);

    await screen.getByLabelText("Reporting period").selectOptions("custom");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      range: "custom",
    });

    await screen.getByLabelText("Start date").fill("2026-11-01");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      customRange: { end: "2026-11-25", start: "2026-11-01" },
      range: "custom",
    });

    const calls = onFiltersChange.mock.calls.length;
    await screen.getByLabelText("End date").fill("2026-10-01");
    expect(onFiltersChange).toHaveBeenCalledTimes(calls);
  });

  it("keeps search controlled and reports pagination", async () => {
    const onFiltersChange = vi.fn();
    const onPageChange = vi.fn();
    const screen = await render(
      <Harness
        model={twoPages}
        onFiltersChange={onFiltersChange}
        onPageChange={onPageChange}
      />,
    );

    await screen.getByLabelText("Search registered users").fill("amara");
    await expect
      .element(screen.getByLabelText("Search registered users"))
      .toHaveValue("amara");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      query: "amara",
    });

    await screen.getByRole("button", { name: "Next" }).click();
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
